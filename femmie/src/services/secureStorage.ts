/**
 * Encrypted persistence adapter for Zustand's `persist` middleware.
 *
 * Health/PII stores (daily logs, etc.) must never hit AsyncStorage in plaintext
 * (CLAUDE.md rule 1). This adapter sits between Zustand and AsyncStorage and runs
 * every persisted blob through `services/encryption` so only ciphertext lands on
 * disk. The DEK lives in the OS keychain via `initLocalDEK` and is loaded on
 * demand, so hydration works regardless of when the app bootstrapped the key.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';
import type { EncryptedPayload } from '../types/encryption';
import { decrypt, encrypt, initLocalDEK } from './encryption';

function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as EncryptedPayload).ciphertext === 'string' &&
    typeof (value as EncryptedPayload).nonce === 'string'
  );
}

export const encryptedStorage: StateStorage = {
  async getItem(name) {
    await initLocalDEK();
    const raw = await AsyncStorage.getItem(name);
    if (raw == null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    // Legacy / pre-encryption data: a bare state blob, not an EncryptedPayload.
    // Hand it back so the store hydrates; the next write re-persists it encrypted.
    if (!isEncryptedPayload(parsed)) return raw;

    return decrypt<string>(parsed);
  },

  async setItem(name, value) {
    await initLocalDEK();
    const payload = encrypt(value);
    await AsyncStorage.setItem(name, JSON.stringify(payload));
  },

  async removeItem(name) {
    await AsyncStorage.removeItem(name);
  },
};
