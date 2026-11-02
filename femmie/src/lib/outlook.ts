import type { DailyLog, EntryValue } from '../types/logging';
import type { CyclePhase } from '../types/cycle';
import {
  extractPeriodStarts,
  averageCycleLength,
  cyclePositionFor,
} from './cycle';

/**
 * "Today's outlook" derivation (F2-08): what the user's OWN history tends to show
 * around this point in the cycle. Pure on-device TS (the roadmap's Fastify framing
 * can't read plaintext health data). Observations are framed as "your pattern shows",
 * never prescriptive, and are only produced when a pattern holds across ≥3 cycles.
 */

/** A pattern must hold across at least this many past cycles before it's surfaced. */
export const MIN_CYCLES_FOR_OUTLOOK = 3;
/** Same-cycle-day window (± days) compared across past cycles. */
export const OUTLOOK_WINDOW_RADIUS = 2;

export interface Observation {
  signal: 'energy' | 'sleep' | 'mood' | 'pain';
  pattern: string;
  /** Past cycles supporting this observation. */
  cyclesObserved: number;
}

export interface TodayOutlook {
  cycleDay: number;
  phase: CyclePhase;
  /** At most 2, strongest first. Empty when there isn't enough history (placeholder). */
  observations: Observation[];
  /** Non-prescriptive nudge derived from the top observation, or null. */
  suggestion: string | null;
  dataBasis: string;
}

const PHASE_LABEL: Record<CyclePhase, string> = {
  period: 'period',
  follicular: 'follicular phase',
  fertile: 'fertile window',
  luteal: 'luteal phase',
};

function numeric(value: EntryValue): number | null {
  return typeof value === 'number' ? value : null;
}

/** Does this day's entries indicate pain? (cramps/back pain/headache.) */
function hasPain(log: DailyLog): boolean {
  return log.entries.some((e) => {
    if (e.categoryId === 'cramps') return typeof e.value === 'number' && e.value >= 3;
    if (e.categoryId === 'back_pain' || e.categoryId === 'headache') return e.value === true;
    return false;
  });
}

function isLowMood(log: DailyLog): boolean {
  return log.entries.some((e) => e.categoryId === 'mood' && (e.value === 'low' || e.value === 'bad'));
}

function meanScale(log: DailyLog, categoryId: string): number | null {
  const entry = log.entries.find((e) => e.categoryId === categoryId);
  return entry ? numeric(entry.value) : null;
}

type CycleWindow = Map<string, DailyLog[]>;

/**
 * Evaluate a signal across the per-cycle window groups. `exhibits` decides whether a
 * cycle shows the pattern from its window logs; returns the supporting cycle count.
 */
function countCyclesExhibiting(
  window: CycleWindow,
  exhibits: (logs: DailyLog[]) => boolean,
): number {
  let n = 0;
  for (const logs of window.values()) if (exhibits(logs)) n++;
  return n;
}

export function todayOutlook(logs: DailyLog[], todayISO: string): TodayOutlook | null {
  const starts = extractPeriodStarts(logs);
  if (starts.length === 0) return null;

  const avg = averageCycleLength(starts);
  const todayPos = cyclePositionFor(starts, todayISO, avg);
  if (!todayPos) return null;

  const { cycleDay, phase, cycleId: currentCycleId } = todayPos;

  // Group past-cycle logs that fall in the same cycle-day window (± radius).
  const window: CycleWindow = new Map();
  for (const log of logs) {
    const pos = cyclePositionFor(starts, log.date, avg);
    if (!pos || pos.cycleId === currentCycleId) continue; // exclude the open cycle
    if (Math.abs(pos.cycleDay - cycleDay) > OUTLOOK_WINDOW_RADIUS) continue;
    const bucket = window.get(pos.cycleId);
    if (bucket) bucket.push(log);
    else window.set(pos.cycleId, [log]);
  }

  const pastCycles = window.size;
  const placeholderBasis =
    pastCycles === 0
      ? 'Keep logging to see your patterns here'
      : `Based on ${pastCycles} past ${pastCycles === 1 ? 'cycle' : 'cycles'}`;

  if (pastCycles < MIN_CYCLES_FOR_OUTLOOK) {
    return { cycleDay, phase, observations: [], suggestion: null, dataBasis: placeholderBasis };
  }

  const candidates: Observation[] = [];

  const lowEnergy = countCyclesExhibiting(window, (ls) => {
    const vals = ls.map((l) => meanScale(l, 'energy')).filter((v): v is number => v !== null);
    return vals.length > 0 && vals.reduce((a, b) => a + b, 0) / vals.length <= 2.5;
  });
  if (lowEnergy >= MIN_CYCLES_FOR_OUTLOOK) {
    candidates.push({
      signal: 'energy',
      pattern: `Your energy tends to run low around now — in ${lowEnergy} past cycles.`,
      cyclesObserved: lowEnergy,
    });
  }

  const poorSleep = countCyclesExhibiting(window, (ls) => {
    const vals = ls.map((l) => meanScale(l, 'sleep_quality')).filter((v): v is number => v !== null);
    return vals.length > 0 && vals.reduce((a, b) => a + b, 0) / vals.length <= 2.5;
  });
  if (poorSleep >= MIN_CYCLES_FOR_OUTLOOK) {
    candidates.push({
      signal: 'sleep',
      pattern: `Your sleep quality tends to dip around now — in ${poorSleep} past cycles.`,
      cyclesObserved: poorSleep,
    });
  }

  const lowMood = countCyclesExhibiting(window, (ls) => ls.some(isLowMood));
  if (lowMood >= MIN_CYCLES_FOR_OUTLOOK) {
    candidates.push({
      signal: 'mood',
      pattern: `Your mood has often dipped around now — in ${lowMood} past cycles.`,
      cyclesObserved: lowMood,
    });
  }

  const pain = countCyclesExhibiting(window, (ls) => ls.some(hasPain));
  if (pain >= MIN_CYCLES_FOR_OUTLOOK) {
    candidates.push({
      signal: 'pain',
      pattern: `You've often logged pain around now — in ${pain} past cycles.`,
      cyclesObserved: pain,
    });
  }

  const observations = candidates
    .sort((a, b) => b.cyclesObserved - a.cyclesObserved || a.signal.localeCompare(b.signal))
    .slice(0, 2);

  return {
    cycleDay,
    phase,
    observations,
    suggestion: observations.length ? suggestionFor(observations[0]) : null,
    dataBasis: `Based on ${pastCycles} past ${pastCycles === 1 ? 'cycle' : 'cycles'}`,
  };
}

/** Gentle, non-prescriptive nudge — never a medical claim. */
function suggestionFor(top: Observation): string {
  switch (top.signal) {
    case 'energy':
      return 'Your pattern shows lower energy around now — a lighter schedule might feel better.';
    case 'sleep':
      return 'Your pattern shows poorer sleep around now — a wind-down routine could help.';
    case 'mood':
      return 'Your pattern shows mood dips around now — be gentle with yourself today.';
    case 'pain':
      return 'Your pattern shows pain around now — you might prepare what usually helps you.';
  }
}
