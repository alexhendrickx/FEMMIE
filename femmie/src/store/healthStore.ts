import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PermissionStatus, SyncEvent } from '../types/health';
import { HEALTH_DATA_TYPES } from '../health/dataTypes';

const MAX_AUDIT_EVENTS = 30;

function makeEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface HealthState {
  permissionStatus: PermissionStatus;
  /** Which data type IDs have their sync paused by the user */
  pausedIds: Set<string>;
  /** Last successful sync timestamp per data type ID */
  lastSyncAt: Record<string, string>;
  /** Rolling audit log — last 30 events */
  auditLog: SyncEvent[];

  setPermissionStatus: (status: PermissionStatus) => void;
  togglePaused: (dataTypeId: string) => void;
  isPaused: (dataTypeId: string) => boolean;
  recordSyncEvent: (event: Omit<SyncEvent, 'id'>) => void;
  clearAuditLog: () => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      permissionStatus: 'not_determined',
      // Zustand persist serialises Set as an array — we restore below
      pausedIds: new Set<string>(),
      lastSyncAt: {},
      auditLog: [],

      setPermissionStatus(status) {
        set({ permissionStatus: status });
      },

      togglePaused(dataTypeId) {
        set((state) => {
          const next = new Set(state.pausedIds);
          if (next.has(dataTypeId)) {
            next.delete(dataTypeId);
          } else {
            next.add(dataTypeId);
          }
          return { pausedIds: next };
        });
      },

      isPaused(dataTypeId) {
        return get().pausedIds.has(dataTypeId);
      },

      recordSyncEvent(event) {
        const full: SyncEvent = { ...event, id: makeEventId() };
        set((state) => {
          const lastSyncAt = { ...state.lastSyncAt };
          if (event.status === 'success') {
            lastSyncAt[event.dataTypeId] = event.timestamp;
          }
          const auditLog = [full, ...state.auditLog].slice(0, MAX_AUDIT_EVENTS);
          return { lastSyncAt, auditLog };
        });
      },

      clearAuditLog() {
        set({ auditLog: [] });
      },
    }),
    {
      name: 'femmie-health',
      storage: createJSONStorage(() => AsyncStorage),
      // Set is not JSON-serialisable; convert to/from array
      partialize: (state) => ({
        ...state,
        pausedIds: Array.from(state.pausedIds),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        pausedIds: new Set<string>(persisted.pausedIds ?? []),
      }),
    },
  ),
);

/** All data type IDs that should be synced (not paused, permission granted) */
export function getActiveSyncIds(state: HealthState): string[] {
  if (state.permissionStatus !== 'granted') return [];
  return HEALTH_DATA_TYPES.filter((t) => !state.pausedIds.has(t.id)).map((t) => t.id);
}
