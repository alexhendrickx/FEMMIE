export interface EncryptedPayload {
  /** base64-encoded ciphertext */
  ciphertext: string;
  /** base64-encoded nonce (random, 24 bytes for secretbox) */
  nonce: string;
  /** schema version — allows migrating encrypted format later */
  v: 1;
}

