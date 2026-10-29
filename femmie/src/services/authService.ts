/**
 * Thin wrapper around the auth API.
 * All network calls go here; components never fetch directly.
 */
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, RegisterBeginResponse, LoginBeginResponse } from '../types/auth';

const API_BASE = 'https://api.femmie.app';

const TOKEN_KEY   = 'femmie_token';
const REFRESH_KEY = 'femmie_refresh';

// ─── Token storage ────────────────────────────────────────────────────────────

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, tokens.token);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const token        = await SecureStore.getItemAsync(TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!token || !refreshToken) return null;
  return { token, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function registerBegin(): Promise<RegisterBeginResponse> {
  const res = await fetch(`${API_BASE}/auth/register/begin`, { method: 'POST' });
  if (!res.ok) throw new Error(`register/begin failed: ${res.status}`);
  return res.json();
}

export async function registerFinish(
  userId: string,
  challenge: string,
  credential: unknown,
): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/auth/register/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, challenge, credential }),
  });
  if (!res.ok) throw new Error(`register/finish failed: ${res.status}`);
  return res.json();
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginBegin(): Promise<LoginBeginResponse> {
  const res = await fetch(`${API_BASE}/auth/login/begin`, { method: 'POST' });
  if (!res.ok) throw new Error(`login/begin failed: ${res.status}`);
  return res.json();
}

export async function loginFinish(
  challenge: string,
  assertion: unknown,
): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/auth/login/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challenge, assertion }),
  });
  if (!res.ok) throw new Error(`login/finish failed: ${res.status}`);
  return res.json();
}

// ─── Token refresh ────────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const { token, refreshToken: newRefresh } = await res.json() as AuthTokens;
    await storeTokens({ token, refreshToken: newRefresh });
    return token;
  } catch {
    return null; // Offline — caller shows reconnect banner, never logs out
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/session`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Fire-and-forget; local tokens are cleared regardless
  }
  await clearTokens();
}
