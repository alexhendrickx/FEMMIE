export type FlowValue = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type ScaleValue = 1 | 2 | 3 | 4 | 5;
export type MoodValue = 'great' | 'good' | 'okay' | 'low' | 'bad';
export type HoursValue = number;
export type BooleanValue = boolean;

export type EntryValue = FlowValue | ScaleValue | MoodValue | HoursValue | BooleanValue;

export type InputType = 'flow' | 'scale' | 'mood' | 'boolean' | 'hours';
export type CategoryGroup = 'flow' | 'symptoms' | 'mood' | 'lifestyle';

export interface Category {
  id: string;
  label: string;
  group: CategoryGroup;
  inputType: InputType;
  /** Hidden outside the period window (cycleDay <= periodWindowDays) */
  periodOnly: boolean;
  icon: string;
}

export interface LogEntry {
  categoryId: string;
  value: EntryValue;
}

export interface DailyLog {
  date: string;       // YYYY-MM-DD
  cycleDay: number;
  entries: LogEntry[];
  savedAt: string;    // ISO timestamp
}

export interface ShortcutCombo {
  id: string;
  label: string;
  entries: LogEntry[];
  usageCount: number;
}
