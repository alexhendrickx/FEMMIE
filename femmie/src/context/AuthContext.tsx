import React, { createContext, useContext, useEffect, useState } from 'react';
import { signUp, signIn, signInWithApple, signOut, getSession } from '../services/authService';
import { supabase } from '../services/supabase';
import { pullFromCloud } from '../services/cloudSync';
import { initLocalDEK, isEncryptionReady } from '../services/encryption';
import type { AuthState } from '../types/auth';

interface AuthContextValue extends AuthState {
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAuthenticated: false,
    isLoading: true,
    isOffline: false,
  });

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setState({
        session,
        isAuthenticated: session !== null,
        isLoading: false,
        isOffline: false,
      });

      // Fire-and-forget: pull remote logs if session exists and DEK is ready
      if (session && isEncryptionReady()) {
        void pullFromCloud(session.userId);
      }
    })();

    // supabase-js's client keeps the session fresh in the background (auto
    // refresh) and tells us whenever it changes — this is the direct
    // replacement for the old hand-rolled silent-refresh-on-foreground effect.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setState((s) => ({
        ...s,
        session: authSession
          ? {
              userId: authSession.user.id,
              accessToken: authSession.access_token,
              refreshToken: authSession.refresh_token,
            }
          : null,
        isAuthenticated: authSession !== null,
        isLoading: false,
      }));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string) => {
    const session = await signUp(email, password);
    setState({ session, isAuthenticated: true, isLoading: false, isOffline: false });
    // The encryption key is handled silently on-device; no user passphrase.
    await initLocalDEK();
    if (session) void pullFromCloud(session.userId);
  };

  const login = async (email: string, password: string) => {
    const session = await signIn(email, password);
    setState({ session, isAuthenticated: true, isLoading: false, isOffline: false });
    await initLocalDEK();
    if (session) void pullFromCloud(session.userId);
  };

  const loginWithApple = async (identityToken: string) => {
    const session = await signInWithApple(identityToken);
    setState({ session, isAuthenticated: true, isLoading: false, isOffline: false });
    await initLocalDEK();
    if (session) void pullFromCloud(session.userId);
  };

  const logout = async () => {
    await signOut();
    setState({ session: null, isAuthenticated: false, isLoading: false, isOffline: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, register, login, loginWithApple, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
