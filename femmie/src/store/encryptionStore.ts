import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecoveryKeyMaterial } from '../types/auth';

export const ENCRYPTION_STORE_VERSION = 1;

interface PersistedEncryptionState {
  keyMaterial: RecoveryKeyMaterial | null;
}

interface EncryptionState extends PersistedEncryptionState {
  /** Set after key is loaded into memory */
  keyReady: boolean;

  setKeyReady: (ready: boolean) => void;
  setKeyMaterial: (material: RecoveryKeyMaterial | null) => void;
}

/**
 * v0 carried cloudSyncEnabled / syncStatus / lastSyncAt for a backup that was never
 * wired. Keep only what is still real.
 */
export function migrateEncryptionState(persisted: unknown): PersistedEncryptionState {
  const old = (persisted ?? {}) as Partial<PersistedEncryptionState>;
  return { keyMaterial: old.keyMaterial ?? null };
}

export const useEncryptionStore = create<EncryptionState>()(
  persist(
    (set) => ({
      keyReady: false,
      keyMaterial: null,

      setKeyReady(ready) {
        set({ keyReady: ready });
      },

      setKeyMaterial(material) {
        set({ keyMaterial: material });
      },
    }),
    {
      name: 'femmie-encryption',
      version: ENCRYPTION_STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted) => migrateEncryptionState(persisted) as EncryptionState,
      // Never persist keyReady — key must be reloaded fresh on each app start
      partialize: (state): PersistedEncryptionState => ({ keyMaterial: state.keyMaterial }),
    },
  ),
);
