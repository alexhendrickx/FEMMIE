export type WipeMode = 'immediate' | 'soft'; // soft = 7-day grace period

export interface EncryptedPayload {
  /** base64-encoded ciphertext */
  ciphertext: string;
  /** base64-encoded nonce (random, 24 bytes for secretbox) */
  nonce: string;
  /** schema version — allows migrating encrypted format later */
  v: 1;
}

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'error';

export interface WipeState {
  requested: boolean;
  mode: WipeMode | null;
  requestedAt: string | null;
}
