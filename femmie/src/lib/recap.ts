import type { DailyLog } from '../types/logging';
import { CATEGORY_MAP } from '../data/categories';
import { extractPeriodStarts, daysBetween } from './cycle';
import {
  isPresent,
  defaultIsSymptom,
  surfaceCorrelations,
  type CorrelationFeedback,
  type CorrelationOptions,
} from './correlation';

/**
 * Cycle Recap generator (F2-12): a once-per-cycle review of the cycle that just
 * completed. Pure TS — the roadmap's "Fastify + TimescaleDB" generator cannot run
 * server-side (ciphertext only), so it runs on-device like the rest of the insight
 * layer. Delivery (push the morning after a period starts) and persistence live in
 * the app/store; this function just computes the card from decrypted logs.
 */

/** How many prior cycles the averages compare against. */
export const RECAP_AVG_WINDOW = 6;
/** Longest gap (days) between flow days still counted as one period. */
const MAX_INTRA_PERIOD_GAP = 2;

export interface RecapSymptom {
  symptomId: string;
  symptomName: string;
  /** Days the symptom was present during the recapped cycle. */
  count: number;
}

export interface CycleRecap {
  /** Period-start ISO date that opened the recapped (completed) cycle. */
  cycleId: string;
  cycleLength: number;
  /** Mean length of up to RECAP_AVG_WINDOW cycles before this one. */
  avgCycleLength: number;
  periodLength: number;
  avgPeriodLength: number;
  /** Up to 3 most-frequent symptoms in this cycle. */
  topSymptoms: RecapSymptom[];
  /** Up to 2 observation sentences from the correlation engine. */
  noticings: string[];
}

function nameOf(id: string, labels?: Record<string, string>): string {
  return (
    labels?.[id] ??
    CATEGORY_MAP.get(id)?.label ??
    id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  );
}

/**
 * Length (in days) of the period that opens at `cycleStart`: consecutive flow-logged
 * days from the start, allowing gaps of up to MAX_INTRA_PERIOD_GAP, bounded by the
 * cycle's end.
 */
function periodLengthForCycle(
  flowDates: string[],
  cycleStart: string,
  cycleEnd: string | undefined,
): number {
  const inCycle = flowDates
    .filter((d) => d >= cycleStart && (cycleEnd === undefined || d < cycleEnd))
    .sort();
  if (inCycle.length === 0) return 0;

  let last = inCycle[0];
  let length = 1;
  for (let i = 1; i < inCycle.length; i++) {
    if (daysBetween(last, inCycle[i]) > MAX_INTRA_PERIOD_GAP) break;
    length = daysBetween(cycleStart, inCycle[i]) + 1;
    last = inCycle[i];
  }
  return length;
}

function topSymptomsInWindow(
  logs: DailyLog[],
  start: string,
  end: string | undefined,
  options: CorrelationOptions,
): RecapSymptom[] {
  const isSymptom = options.isSymptom ?? defaultIsSymptom;
  const counts = new Map<string, number>();

  for (const log of logs) {
    if (log.date < start) continue;
    if (end !== undefined && log.date >= end) continue;
    for (const entry of log.entries) {
      if (!isSymptom(entry.categoryId)) continue;
      if (!isPresent(entry.value)) continue;
      counts.set(entry.categoryId, (counts.get(entry.categoryId) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([symptomId, count]) => ({
      symptomId,
      symptomName: nameOf(symptomId, options.labels),
      count,
    }));
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
}

/**
 * Generate the recap for the most recently COMPLETED cycle.
 *
 * CONSTRAINT (F2-12): returns null — never a placeholder — unless at least 2 complete
 * cycles exist (one to recap + at least one for the average).
 */
export function generateRecap(
  logs: DailyLog[],
  feedback: CorrelationFeedback = {},
  options: CorrelationOptions = {},
): CycleRecap | null {
  const starts = extractPeriodStarts(logs);
  // Completed cycles = starts.length - 1 (the last start opens the still-open cycle).
  if (starts.length < 3) return null; // need ≥2 completed cycles

  const openIdx = starts.length - 1;
  const recapIdx = openIdx - 1; // most recently completed cycle
  const cycleId = starts[recapIdx];
  const cycleEnd = starts[recapIdx + 1];
  const cycleLength = daysBetween(cycleId, cycleEnd);

  // Prior completed cycles (up to RECAP_AVG_WINDOW) for the averages.
  const priorCycleLengths: number[] = [];
  const priorPeriodLengths: number[] = [];
  const flowDates = logs
    .filter((l) => l.entries.some((e) => e.categoryId === 'menstrual_flow'))
    .map((l) => l.date);

  for (let i = recapIdx - 1; i >= 0 && priorCycleLengths.length < RECAP_AVG_WINDOW; i--) {
    priorCycleLengths.push(daysBetween(starts[i], starts[i + 1]));
    priorPeriodLengths.push(periodLengthForCycle(flowDates, starts[i], starts[i + 1]));
  }

  const periodLength = periodLengthForCycle(flowDates, cycleId, cycleEnd);
  const noticings = surfaceCorrelations(logs, feedback, options)
    .slice(0, 2)
    .map((c) => c.pattern);

  return {
    cycleId,
    cycleLength,
    avgCycleLength: priorCycleLengths.length ? mean(priorCycleLengths) : cycleLength,
    periodLength,
    avgPeriodLength: priorPeriodLengths.length ? mean(priorPeriodLengths) : periodLength,
    topSymptoms: topSymptomsInWindow(logs, cycleId, cycleEnd, options),
    noticings,
  };
}
