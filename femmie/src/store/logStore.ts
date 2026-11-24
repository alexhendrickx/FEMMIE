import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptedStorage } from '../services/secureStorage';
import type { DailyLog } from '../types/logging';

/**
 * v0: pre-"daily ritual" shape (shortcuts, reminderTime, quickSymptomIds,
 * correlationFeedback). v1: the ritual-only shape below.
 */
export const LOG_STORE_VERSION = 1;

/**
 * Persist keys of stores deleted in the daily-ritual refactor. They still hold
 * encrypted mood/pain/tag data on devices that ran an older build, readable with
 * the current DEK, yet no screen shows or wipes them. Removing them on upgrade
 * keeps "what we store" honest.
 */
export const LEGACY_STORE_KEYS = ['femmie-mood', 'femmie-pain', 'femmie-tags'] as const;

async function purgeLegacyStores(): Promise<void> {
  await Promise.all(LEGACY_STORE_KEYS.map((k) => AsyncStorage.removeItem(k).catch(() => {})));
}

type PersistedLogState = Pick<
  LogState,
  'logs' | 'reminderEnabled' | 'cycleLengthPref' | 'phaseContentMuted' | 'onboardingDone'
>;

/** Keep only the fields the current store owns; fill missing ones with defaults. */
export function migrateLogState(persisted: unknown): PersistedLogState {
  const p = (persisted ?? {}) as Partial<PersistedLogState>;
  const logs = p.logs ?? {};
  return {
    logs,
    reminderEnabled: p.reminderEnabled ?? false,
    cycleLengthPref: p.cycleLengthPref ?? 28,
    phaseContentMuted: p.phaseContentMuted ?? false,
    // Builds before v1 never stored this; anyone with a log has been through onboarding.
    onboardingDone: p.onboardingDone ?? Object.keys(logs).length > 0,
  };
}

// Hydration can end in success or failure; zustand's own hasHydrated() only
// reports success, which would leave the app on its splash forever after a
// failed read. This tracks "finished either way".
let hydrationSettled = false;
const hydrationListeners = new Set<() => void>();

export function isLogStoreHydrationSettled(): boolean {
  return hydrationSettled;
}

export function onLogStoreHydrationSettled(listener: () => void): () => void {
  hydrationListeners.add(listener);
  return () => hydrationListeners.delete(listener);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LogState {
  /** All logs keyed by YYYY-MM-DD */
  logs: Record<string, DailyLog>;
  reminderEnabled: boolean;
  /** User-stated typical cycle length (onboarding) — powers day-one prediction. */
  cycleLengthPref: number;
  /** Hides the Today's-outlook card on Home. Persisted through the same encrypted boundary. */
  phaseContentMuted: boolean;
  /** Persisted so a cold start goes straight to Today instead of replaying onboarding. */
  onboardingDone: boolean;

  saveLog: (log: Omit<DailyLog, 'savedAt'>) => void;
  hasLoggedToday: () => boolean;
  setReminder: (enabled: boolean) => void;
  setCycleLengthPref: (days: number) => void;
  setPhaseContentMuted: (muted: boolean) => void;
  completeOnboarding: () => void;
  /** Reset to factory state — the privacy wipe calls this BEFORE destroying the DEK. */
  clearAll: () => void;
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: {},
      reminderEnabled: false,
      cycleLengthPref: 28,
      phaseContentMuted: false,
      onboardingDone: false,

      saveLog(log) {
        const savedAt = new Date().toISOString();
        const full: DailyLog = { ...log, savedAt };
        set((state) => ({ logs: { ...state.logs, [log.date]: full } }));
      },

      hasLoggedToday() {
        return Boolean(get().logs[todayISO()]);
      },

      setReminder(enabled) {
        set({ reminderEnabled: enabled });
      },

      setCycleLengthPref(days) {
        set({ cycleLengthPref: days });
      },

      setPhaseContentMuted(muted) {
        set({ phaseContentMuted: muted });
      },

      completeOnboarding() {
        set({ onboardingDone: true });
      },

      clearAll() {
        set({
          logs: {},
          reminderEnabled: false,
          cycleLengthPref: 28,
          phaseContentMuted: false,
          onboardingDone: false,
        });
      },
    }),
    {
      name: 'femmie-logs',
      // Health values (flow, mood, symptoms) — encrypted at rest, never plaintext.
      storage: createJSONStorage(() => encryptedStorage),
      version: LOG_STORE_VERSION,
      partialize: (s) => ({
        logs: s.logs,
        reminderEnabled: s.reminderEnabled,
        cycleLengthPref: s.cycleLengthPref,
        phaseContentMuted: s.phaseContentMuted,
        onboardingDone: s.onboardingDone,
      }),
      onRehydrateStorage: () => () => {
        hydrationSettled = true;
        hydrationListeners.forEach((l) => l());
      },
      migrate: async (persisted, version) => {
        if (version < 1) await purgeLegacyStores();
        return migrateLogState(persisted);
      },
    },
  ),
);
