import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../services/secureStorage';
import type { DailyLog } from '../types/logging';

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

  saveLog: (log: Omit<DailyLog, 'savedAt'>) => void;
  hasLoggedToday: () => boolean;
  setReminder: (enabled: boolean) => void;
  setCycleLengthPref: (days: number) => void;
  setPhaseContentMuted: (muted: boolean) => void;
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

      clearAll() {
        set({
          logs: {},
          reminderEnabled: false,
          cycleLengthPref: 28,
          phaseContentMuted: false,
        });
      },
    }),
    {
      name: 'femmie-logs',
      // Health values (flow, mood, symptoms) — encrypted at rest, never plaintext.
      storage: createJSONStorage(() => encryptedStorage),
    },
  ),
);
