import type { DailyLog } from '../types/logging';
import type { DayData, DayState } from '../types/calendar';
import {
  extractPeriodStarts,
  averageCycleLength,
  predictNextPeriod,
  cyclePhase,
} from './cycle';

/**
 * Derive calendar day-states (confirmed period / predicted period / fertile) from the
 * user's own logs + prediction, for the History calendar. Pure, framework-free, tested —
 * replaces the hardcoded demo array the app shipped with.
 */

function parseUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}
function addDays(iso: string, n: number): string {
  return new Date(parseUTC(iso) + n * 86400000).toISOString().slice(0, 10);
}
function daysInclusive(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const span = Math.round((parseUTC(toISO) - parseUTC(fromISO)) / 86400000);
  for (let i = 0; i <= span; i++) out.push(addDays(fromISO, i));
  return out;
}

const PRIORITY: Record<Exclude<DayState, null>, number> = {
  confirmed: 3,
  predicted: 2,
  fertile: 1,
};

export function buildCalendarDays(logs: DailyLog[], todayISO: string): DayData[] {
  const state = new Map<string, Exclude<DayState, null>>();
  const set = (date: string, s: Exclude<DayState, null>) => {
    const cur = state.get(date);
    if (!cur || PRIORITY[s] > PRIORITY[cur]) state.set(date, s);
  };

  // Confirmed: any day a menstrual flow was logged.
  for (const log of logs) {
    if (log.entries.some((e) => e.categoryId === 'menstrual_flow')) set(log.date, 'confirmed');
  }

  const starts = extractPeriodStarts(logs);
  if (starts.length > 0) {
    const avg = Math.round(averageCycleLength(starts));
    const lastStart = starts[starts.length - 1];

    // Fertile window of the current (open) cycle, from the phase model.
    for (let day = 1; day <= avg; day++) {
      if (cyclePhase(day, avg) === 'fertile') set(addDays(lastStart, day - 1), 'fertile');
    }

    // Predicted next period: the uncertainty window around the most-likely start.
    const prediction = predictNextPeriod(starts, todayISO);
    if (prediction.windowStart && prediction.windowEnd) {
      for (const date of daysInclusive(prediction.windowStart, prediction.windowEnd)) {
        set(date, 'predicted');
      }
    }
  }

  return [...state.entries()]
    .map(([date, s]) => ({ date, state: s }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
