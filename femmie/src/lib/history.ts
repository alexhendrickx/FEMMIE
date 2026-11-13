import type { DailyLog, EntryValue } from '../types/logging';
import { CATEGORY_MAP } from '../data/categories';

/**
 * Pure, framework-free logic for the History "Week / Month / List" view (UX decision #9).
 *
 * The three segments only render; everything decided here — the current week's 7 dates,
 * the reverse-chronological grouping of logged days, and the short per-entry summaries —
 * lives in this module so it has unit coverage and survives the iOS/Android/backend split.
 * No react-native / expo / SQLite imports. CATEGORY_MAP is pure data (labels + icons).
 */

/** Mon-first weekday labels, matching the calendar's WEEKDAYS. */
export const WEEK_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

function parseUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function addDays(ms: number, n: number): string {
  return new Date(ms + n * 86400000).toISOString().slice(0, 10);
}

/** Monday-first index (Mon = 0 … Sun = 6) for an ISO date. */
function mondayIndex(iso: string): number {
  return (new Date(parseUTC(iso)).getUTCDay() + 6) % 7;
}

/** The 7 ISO dates (Mon → Sun) of the week containing `todayISO`. */
export function currentWeekDates(todayISO: string): string[] {
  const monday = parseUTC(todayISO) - mondayIndex(todayISO) * 86400000;
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export interface WeekCell {
  date: string;
  /** Mon-first short label, e.g. 'Mo'. */
  weekdayLabel: string;
  /** Day-of-month number for display. */
  dayOfMonth: number;
  isToday: boolean;
}

/** Build the 7 display cells for the current week's horizontal strip. */
export function buildWeekCells(todayISO: string): WeekCell[] {
  return currentWeekDates(todayISO).map((date) => ({
    date,
    weekdayLabel: WEEK_LABELS[mondayIndex(date)],
    dayOfMonth: new Date(parseUTC(date)).getUTCDate(),
    isToday: date === todayISO,
  }));
}

/**
 * Logged days (those with at least one entry), most recent first, for the List segment.
 */
export function loggedDaysDescending(logs: Record<string, DailyLog>): DailyLog[] {
  return Object.values(logs)
    .filter((log) => log.entries.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface DaySummaryItem {
  categoryId: string;
  icon: string;
  label: string;
  /** A short value label (e.g. 'medium', '3/5', '7h'), or null for a plain present/boolean entry. */
  valueLabel: string | null;
}

/** Format a single entry's value into a short human label, using its category's input type. */
export function formatEntryValue(categoryId: string, value: EntryValue): string | null {
  if (typeof value === 'boolean') return null; // boolean entries are "present"; icon + label is enough
  if (typeof value === 'string') return value.replace(/_/g, ' '); // flow / mood words
  // number: disambiguate scale (1–5), hours, and free numeric inputs by input type
  const cat = CATEGORY_MAP.get(categoryId);
  if (cat?.inputType === 'hours') return `${value}h`;
  if (cat?.inputType === 'number') return cat.unit ? `${value} ${cat.unit}` : `${value}`;
  return `${value}/5`;
}

/** Summarize a day's entries into short icon + label (+ optional value) chips for the List row. */
export function summarizeDay(log: DailyLog): DaySummaryItem[] {
  return log.entries.map((entry) => {
    const cat = CATEGORY_MAP.get(entry.categoryId);
    return {
      categoryId: entry.categoryId,
      icon: cat?.icon ?? '•',
      label: cat?.label ?? entry.categoryId,
      valueLabel: formatEntryValue(entry.categoryId, entry.value),
    };
  });
}
