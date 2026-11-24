/**
 * Thin wrapper around Supabase Auth — email+password.
 * Session persistence/refresh is handled by the `supabase` client itself
 * (see services/supabase.ts); this module just exposes the three verbs the
 * app needs plus a session getter.
 */
import { supabase } from './supabase';
import type { AuthSession } from '../types/auth';

function toSession(session: { user: { id: string }; access_token: string; refresh_token: string } | null): AuthSession | null {
  if (!session) return null;
  return {
    userId: session.user.id,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

export async function signUp(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const session = toSession(data.session as never);
  if (!session) throw new Error('Sign-up succeeded but no session was returned');
  return session;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const session = toSession(data.session as never);
  if (!session) throw new Error('Sign-in succeeded but no session was returned');
  return session;
}

export async function signInWithApple(identityToken: string): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  });
  if (error) throw error;
  const session = toSession(data.session as never);
  if (!session) throw new Error('Apple sign-in succeeded but no session was returned');
  return session;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Current session, if any — used on app bootstrap. */
export async function getSession(): Promise<AuthSession | null> {
  const { data } = await supabase.auth.getSession();
  return toSession(data.session as never);
}
