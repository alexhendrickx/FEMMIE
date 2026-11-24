export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
}

export interface RecoveryKeyMaterial {
  /** base64-encoded, libsodium crypto_secretbox-wrapped DEK */
  wrappedDek: string;
  /** base64-encoded Argon2id salt */
  salt: string;
  /** Argon2id KDF params needed to re-derive the same KEK */
  kdfParams: { opslimit: number; memlimit: number };
}
