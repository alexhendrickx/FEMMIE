import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  loadTokens,
  storeTokens,
  clearTokens,
  refreshAccessToken,
  logout as apiLogout,
} from '../services/authService';
import {
  createPasskey,
  getPasskey,
  hasExistingPasskey,
} from '../services/passkeyService';
import {
  registerBegin,
  registerFinish,
  loginBegin,
  loginFinish,
} from '../services/authService';
import type { AuthState } from '../types/auth';

interface AuthContextValue extends AuthState {
  register: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasPasskey: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    tokens: null,
    accountId: null,
    isAuthenticated: false,
    isLoading: true,
    isOffline: false,
  });
  const [hasPasskey, setHasPasskey] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Decode accountId from PASETO payload (base64 middle segment) ─────────────
  function extractAccountId(token: string): string | null {
    try {
      const parts = token.split('.');
      // PASETO v4.local: v4.local.<payload>.<optional-footer>
      // payload is not base64-decodable as plaintext (it's encrypted) —
      // server always returns accountId as a separate field or we store it separately.
      // We store it in SecureStore alongside the token.
      void parts;
      return null;
    } catch {
      return null;
    }
  }

  // ── Silent refresh whenever app comes to foreground ──────────────────────────
  const silentRefresh = useCallback(async (refreshToken: string) => {
    const newToken = await refreshAccessToken(refreshToken);
    if (newToken) {
      setState((s) => ({
        ...s,
        tokens: { token: newToken, refreshToken },
        isOffline: false,
      }));
    } else {
      // Offline — keep user authenticated, just flag it
      setState((s) => ({ ...s, isOffline: true }));
    }
  }, []);

  // ── Bootstrap: load persisted tokens on mount ────────────────────────────────
  useEffect(() => {
    (async () => {
      const [tokens, passkeyExists] = await Promise.all([
        loadTokens(),
        hasExistingPasskey(),
      ]);

      setHasPasskey(passkeyExists);

      if (!tokens) {
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      // Try a silent refresh immediately — if offline, keep logged in
      const newToken = await refreshAccessToken(tokens.refreshToken);
      const activeToken = newToken ?? tokens.token;

      setState({
        tokens: { token: activeToken, refreshToken: tokens.refreshToken },
        accountId: null, // resolved server-side via PASETO
        isAuthenticated: true,
        isLoading: false,
        isOffline: !newToken,
      });
    })();
  }, []);

  // ── Refresh on foreground ─────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && state.tokens?.refreshToken) {
        silentRefresh(state.tokens.refreshToken);
      }
    });
    return () => sub.remove();
  }, [state.tokens?.refreshToken, silentRefresh]);

  // ── Register ──────────────────────────────────────────────────────────────────
  const register = useCallback(async () => {
    const { challenge, rpId, userId } = await registerBegin();
    const credential = await createPasskey(challenge, userId, rpId);
    const tokens = await registerFinish(userId, challenge, credential);
    await storeTokens(tokens);
    setHasPasskey(true);
    setState({
      tokens,
      accountId: userId,
      isAuthenticated: true,
      isLoading: false,
      isOffline: false,
    });
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    const { challenge } = await loginBegin();
    const assertion = await getPasskey(challenge, 'femmie.app');
    const tokens = await loginFinish(challenge, assertion);
    await storeTokens(tokens);
    setState({
      tokens,
      accountId: null,
      isAuthenticated: true,
      isLoading: false,
      isOffline: false,
    });
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (state.tokens?.token) {
      await apiLogout(state.tokens.token);
    } else {
      await clearTokens();
    }
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setState({
      tokens: null,
      accountId: null,
      isAuthenticated: false,
      isLoading: false,
      isOffline: false,
    });
  }, [state.tokens]);

  return (
    <AuthContext.Provider value={{ ...state, register, login, logout, hasPasskey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
