import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORY_MAP } from '../data/categories';
import type { DailyLog, LogEntry, ShortcutCombo } from '../types/logging';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateShortcutLabel(entries: LogEntry[]): string {
  return entries
    .slice(0, 3)
    .map((e) => CATEGORY_MAP.get(e.categoryId)?.label ?? e.categoryId)
    .join(' · ');
}

function detectShortcuts(logs: DailyLog[]): ShortcutCombo[] {
  const recent = Object.values(logs).slice(-30);
  const counts = new Map<string, { entries: LogEntry[]; count: number }>();

  for (const log of recent) {
    if (log.entries.length < 2) continue;
    const sorted = [...log.entries].sort((a, b) =>
      a.categoryId.localeCompare(b.categoryId),
    );
    const key = sorted.map((e) => `${e.categoryId}:${String(e.value)}`).join('|');
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, { entries: sorted, count: 1 });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((combo, i) => ({
      id: `shortcut_${i}`,
      label: generateShortcutLabel(combo.entries),
      entries: combo.entries,
      usageCount: combo.count,
    }));
}

interface LogState {
  /** All logs keyed by YYYY-MM-DD */
  logs: Record<string, DailyLog>;
  shortcuts: ShortcutCombo[];
  reminderEnabled: boolean;
  reminderTime: { hour: number; minute: number };

  saveLog: (log: Omit<DailyLog, 'savedAt'>) => void;
  getLog: (date: string) => DailyLog | undefined;
  hasLoggedToday: () => boolean;
  setReminder: (enabled: boolean, time?: { hour: number; minute: number }) => void;
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: {},
      shortcuts: [],
      reminderEnabled: false,
      reminderTime: { hour: 21, minute: 30 },

      saveLog(log) {
        const savedAt = new Date().toISOString();
        const full: DailyLog = { ...log, savedAt };
        set((state) => {
          const logs = { ...state.logs, [log.date]: full };
          const shortcuts = detectShortcuts(Object.values(logs));
          return { logs, shortcuts };
        });
      },

      getLog(date) {
        return get().logs[date];
      },

      hasLoggedToday() {
        return Boolean(get().logs[todayISO()]);
      },

      setReminder(enabled, time) {
        set((state) => ({
          reminderEnabled: enabled,
          reminderTime: time ?? state.reminderTime,
        }));
      },
    }),
    {
      name: 'femmie-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
