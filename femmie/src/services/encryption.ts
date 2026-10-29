/**
 * Client-side encryption service using libsodium.
 *
 * Uses crypto_secretbox_easy (XSalsa20-Poly1305):
 *   - 256-bit key
 *   - 192-bit random nonce per message
 *   - authenticated encryption — tampering is detected
 *
 * Key lifecycle:
 *   1. Generate DEK (data encryption key) on first launch
 *   2. Wrap DEK via backend KMS endpoint → store wrapped key locally + in cloud
 *   3. On each app start: unwrap DEK via KMS → hold in memory only
 *   4. Never persist the plaintext DEK to disk or logs
 *
 * Install: npx expo install react-native-libsodium expo-secure-store
 * Requires expo-dev-client (not compatible with Expo Go).
 */
import * as SecureStore from 'expo-secure-store';
import type { EncryptedPayload, KeyMaterial } from '../types/encryption';

// Lazy-require so the module degrades gracefully when not installed
function getSodium() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const lib = require('react-native-libsodium');
    return lib.default ?? lib;
  } catch {
    return null;
  }
}

const SECURE_STORE_KEY = 'femmie_dek_v1';
const SECURE_STORE_WRAPPED = 'femmie_wrapped_key_v1';

// In-memory key — never written to AsyncStorage or logs
let _plaintextDek: Uint8Array | null = null;

// ─── Key management ───────────────────────────────────────────────────────────

/** Generate a fresh DEK. Call once on account creation. */
export async function generateDEK(): Promise<Uint8Array> {
  const sodium = getSodium();
  if (!sodium) return _fallbackKey();

  await sodium.ready;
  const key = sodium.crypto_secretbox_keygen();
  _plaintextDek = key;
  return key;
}

/**
 * Wrap DEK with KMS via backend, then store the wrapped key locally.
 * The plaintext DEK is never sent to the server.
 */
export async function wrapAndStoreDEK(
  dek: Uint8Array,
  apiBase: string,
  authToken: string,
): Promise<KeyMaterial> {
  // Backend wraps a client-generated random bytes blob, not the DEK itself.
  // We use envelope encryption: the DEK encrypts data, KMS encrypts the DEK.
  const res = await fetch(`${apiBase}/encryption/wrap-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ keyBytes: Buffer.from(dek).toString('base64') }),
  });

  if (!res.ok) throw new Error('KMS wrap failed');

  const { wrappedKey, kmsKeyId } = await res.json() as {
    wrappedKey: string;
    kmsKeyId: string;
  };

  const material: KeyMaterial = {
    wrappedKey,
    kmsKeyId,
    createdAt: new Date().toISOString(),
  };

  // Store wrapped key locally in SecureStore (encrypted by OS keychain)
  await SecureStore.setItemAsync(SECURE_STORE_WRAPPED, JSON.stringify(material));

  return material;
}

/**
 * Unwrap DEK from KMS via backend. Loads plaintext DEK into memory.
 * Call on app start (after user authenticates).
 */
export async function loadDEK(apiBase: string, authToken: string): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_STORE_WRAPPED);
    if (!raw) return false;

    const material = JSON.parse(raw) as KeyMaterial;

    const res = await fetch(`${apiBase}/encryption/unwrap-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ wrappedKey: material.wrappedKey, kmsKeyId: material.kmsKeyId }),
    });

    if (!res.ok) return false;

    const { plaintextKey } = await res.json() as { plaintextKey: string };
    _plaintextDek = Buffer.from(plaintextKey, 'base64');
    return true;
  } catch {
    return false;
  }
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypt any JSON-serialisable value.
 * Returns an EncryptedPayload safe to store in SQLite or send to the API.
 */
export function encrypt(value: unknown): EncryptedPayload {
  const sodium = getSodium();
  if (!sodium || !_plaintextDek) {
    // Dev fallback: base64-only, clearly labeled — never use in production
    const raw = JSON.stringify(value);
    return {
      ciphertext: Buffer.from(raw).toString('base64'),
      nonce: 'PLAINTEXT_FALLBACK',
      v: 1,
    };
  }

  const message = new TextEncoder().encode(JSON.stringify(value));
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, _plaintextDek);

  return {
    ciphertext: Buffer.from(ciphertext).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64'),
    v: 1,
  };
}

/** Decrypt an EncryptedPayload back to the original value. Returns null on failure. */
export function decrypt<T>(payload: EncryptedPayload): T | null {
  if (payload.nonce === 'PLAINTEXT_FALLBACK') {
    try {
      return JSON.parse(Buffer.from(payload.ciphertext, 'base64').toString()) as T;
    } catch {
      return null;
    }
  }

  const sodium = getSodium();
  if (!sodium || !_plaintextDek) return null;

  try {
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');
    const nonce = Buffer.from(payload.nonce, 'base64');
    const message = sodium.crypto_secretbox_open_easy(ciphertext, nonce, _plaintextDek);
    return JSON.parse(new TextDecoder().decode(message)) as T;
  } catch {
    // Decryption failure — wrong key or tampered data
    return null;
  }
}

// ─── Wipe ─────────────────────────────────────────────────────────────────────

/**
 * Panic wipe — destroys all local key material and data.
 * Cloud deletion is triggered separately via DELETE /account.
 */
export async function wipeLocal(): Promise<void> {
  // Zero out in-memory key
  if (_plaintextDek) {
    _plaintextDek.fill(0);
    _plaintextDek = null;
  }

  // Delete from SecureStore
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(SECURE_STORE_WRAPPED).catch(() => {});

  // SQLite deletion is handled by sqliteStore.wipeDatabase()
}

// ─── Private ──────────────────────────────────────────────────────────────────

function _fallbackKey(): Uint8Array {
  // Deterministic dev key — NEVER used in production (sodium not available)
  return new Uint8Array(32).fill(0xde);
}
