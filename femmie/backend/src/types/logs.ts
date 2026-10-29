export type FlowValue = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type ScaleValue = 1 | 2 | 3 | 4 | 5;
export type MoodValue = 'great' | 'good' | 'okay' | 'low' | 'bad';
export type EntryValue = FlowValue | ScaleValue | MoodValue | number | boolean;

export interface LogEntry {
  categoryId: string;
  value: EntryValue;
}

// POST /logs — body
export interface CreateLogBody {
  date: string;      // YYYY-MM-DD
  cycleDay: number;  // 1-indexed
  entries: LogEntry[];
}

// POST /logs — response
export interface CreateLogResponse {
  id: string;
  date: string;
  savedAt: string;
}

// GET /logs/suggestions — response
export interface SuggestionsResponse {
  categoryIds: string[];
}
