import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { encryptedStorage } from '../services/secureStorage';
import { isValidDrspEntry } from '../lib/mood';
import { isIsoDate } from '../lib/cycle';
import type { DrspEntry } from '../types/mood';

interface MoodState {
  /** Opt-in flag for the structured DRSP record. Off by default. */
  drspEnabled: boolean;
  /** One DRSP record per day, keyed by YYYY-MM-DD. Health data — encrypted at rest. */
  entries: Record<string, DrspEntry>;
  /** Permanent "don't show this again" for the clinician safeguard. Never auto-resets. */
  safeguardDismissed: boolean;

  setDrspEnabled: (enabled: boolean) => void;
  /**
   * Validate + upsert one day's record. Returns false (and writes nothing) when the
   * date is not YYYY-MM-DD or the scores fail `isValidDrspEntry`.
   */
  saveEntry: (entry: DrspEntry) => boolean;
  removeEntry: (date: string) => void;
  dismissSafeguard: () => void;
  /** Used by the privacy wipe. Resets every field, including the dismiss flag. */
  clearAll: () => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      drspEnabled: false,
      entries: {},
      safeguardDismissed: false,

      setDrspEnabled(enabled) {
        set({ drspEnabled: enabled });
      },

      saveEntry(entry) {
        if (!isIsoDate(entry.date) || !isValidDrspEntry(entry)) return false;
        const stored: DrspEntry = { date: entry.date, scores: [...entry.scores] };
        set((state) => ({ entries: { ...state.entries, [stored.date]: stored } }));
        return true;
      },

      removeEntry(date) {
        set((state) => {
          if (!(date in state.entries)) return {};
          const entries = { ...state.entries };
          delete entries[date];
          return { entries };
        });
      },

      dismissSafeguard() {
        set({ safeguardDismissed: true });
      },

      clearAll() {
        set({ drspEnabled: false, entries: {}, safeguardDismissed: false });
      },
    }),
    {
      name: 'femmie-mood',
      // DRSP scores = mental-health data — encrypted at rest via encryptedStorage, never plaintext.
      storage: createJSONStorage(() => encryptedStorage),
    },
  ),
);
