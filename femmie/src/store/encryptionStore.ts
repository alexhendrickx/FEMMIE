import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncStatus } from '../types/encryption';
import type { RecoveryKeyMaterial } from '../types/auth';

interface EncryptionState {
  /** Set after key is loaded into memory */
  keyReady: boolean;
  keyMaterial: RecoveryKeyMaterial | null;
  cloudSyncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;

  setKeyReady: (ready: boolean) => void;
  setKeyMaterial: (material: RecoveryKeyMaterial | null) => void;
  setCloudSync: (enabled: boolean) => void;
  setSyncStatus: (status: SyncStatus, syncedAt?: string) => void;
}

export const useEncryptionStore = create<EncryptionState>()(
  persist(
    (set) => ({
      keyReady: false,
      keyMaterial: null,
      cloudSyncEnabled: false,
      syncStatus: 'local_only',
      lastSyncAt: null,

      setKeyReady(ready) {
        set({ keyReady: ready });
      },

      setKeyMaterial(material) {
        set({ keyMaterial: material });
      },

      setCloudSync(enabled) {
        set({
          cloudSyncEnabled: enabled,
          syncStatus: enabled ? 'syncing' : 'local_only',
        });
      },

      setSyncStatus(status, syncedAt) {
        set({ syncStatus: status, lastSyncAt: syncedAt ?? null });
      },
    }),
    {
      name: 'femmie-encryption',
      storage: createJSONStorage(() => AsyncStorage),
      // Never persist keyReady — key must be reloaded fresh on each app start
      partialize: (state) => ({
        keyMaterial: state.keyMaterial,
        cloudSyncEnabled: state.cloudSyncEnabled,
        lastSyncAt: state.lastSyncAt,
      }),
    },
  ),
);
