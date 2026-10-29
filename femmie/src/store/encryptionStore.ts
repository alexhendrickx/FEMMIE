import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyMaterial, SyncStatus, WipeMode, WipeState } from '../types/encryption';

interface EncryptionState {
  /** Set after key is loaded into memory */
  keyReady: boolean;
  keyMaterial: KeyMaterial | null;
  cloudSyncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  wipe: WipeState;

  setKeyReady: (ready: boolean) => void;
  setKeyMaterial: (material: KeyMaterial | null) => void;
  setCloudSync: (enabled: boolean) => void;
  setSyncStatus: (status: SyncStatus, syncedAt?: string) => void;
  requestWipe: (mode: WipeMode) => void;
  clearWipeRequest: () => void;
}

export const useEncryptionStore = create<EncryptionState>()(
  persist(
    (set) => ({
      keyReady: false,
      keyMaterial: null,
      cloudSyncEnabled: false,
      syncStatus: 'local_only',
      lastSyncAt: null,
      wipe: { requested: false, mode: null, requestedAt: null },

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

      requestWipe(mode) {
        set({
          wipe: {
            requested: true,
            mode,
            requestedAt: new Date().toISOString(),
          },
        });
      },

      clearWipeRequest() {
        set({ wipe: { requested: false, mode: null, requestedAt: null } });
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
        wipe: state.wipe,
      }),
    },
  ),
);
