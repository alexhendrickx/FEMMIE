import type { DailyLog } from '../types/logging';
import type { CyclePhase } from '../types/cycle';
import {
  extractPeriodStarts,
  averageCycleLength,
  cyclePositionFor,
} from './cycle';
import { SCALE_PRESENT_THRESHOLD } from './correlation';

/**
 * "Today's outlook" derivation (F2-08): what the user's OWN history tends to show
 * around this point in the cycle. Pure on-device TS (the roadmap's Fastify framing
 * can't read plaintext health data). Observations are framed as "your pattern shows",
 * never prescriptive, and only produced when a signal is BOTH frequent enough (≥3
 * cycles) and the majority of cycles that logged it (so a 3-of-12 blip isn't dressed
 * up as a tendency).
 */

/** A pattern must hold across at least this many past cycles before it's surfaced. */
export const MIN_CYCLES_FOR_OUTLOOK = 3;
/** ...and in at least this share of the cycles that actually logged the signal. */
export const OUTLOOK_MAJORITY_RATIO = 0.5;
/** Same-cycle-day window (± days) compared across past cycles. */
export const OUTLOOK_WINDOW_RADIUS = 2;
/** A 1–5 scale at/below this mean is "low" (energy, sleep quality). */
const LOW_SCALE_CUTOFF = 2.5;

const PAIN_CATEGORIES = ['cramps', 'back_pain', 'headache'];

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

function cyclesWord(n: number): string {
  return n === 1 ? 'cycle' : 'cycles';
}

/** Mean of a 1–5 scale category across a cycle's window logs, or null if never logged. */
function scaleMean(logs: DailyLog[], categoryId: string): number | null {
  const vals: number[] = [];
  for (const log of logs) {
    for (const e of log.entries) {
      if (e.categoryId === categoryId && typeof e.value === 'number') vals.push(e.value);
    }
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function logsCategory(logs: DailyLog[], ids: string[]): boolean {
  return logs.some((l) => l.entries.some((e) => ids.includes(e.categoryId)));
}

function hasPainDay(logs: DailyLog[]): boolean {
  return logs.some((log) =>
    log.entries.some((e) => {
      if (e.categoryId === 'cramps') {
        return typeof e.value === 'number' && e.value >= SCALE_PRESENT_THRESHOLD;
      }
      if (e.categoryId === 'back_pain' || e.categoryId === 'headache') return e.value === true;
      return false;
    }),
  );
}

function hasLowMoodDay(logs: DailyLog[]): boolean {
  return logs.some((log) =>
    log.entries.some((e) => e.categoryId === 'mood' && (e.value === 'low' || e.value === 'bad')),
  );
}

/**
 * Each signal declares: whether a cycle logged it at all (the denominator), whether the
 * cycle exhibits the pattern (the numerator), the sentence, and a gentle suggestion.
 */
interface SignalDef {
  signal: Observation['signal'];
  logged: (logs: DailyLog[]) => boolean;
  exhibits: (logs: DailyLog[]) => boolean;
  phrase: (count: number, denom: number) => string;
  suggestion: string;
}

const SIGNALS: SignalDef[] = [
  {
    signal: 'energy',
    logged: (ls) => scaleMean(ls, 'energy') !== null,
    exhibits: (ls) => {
      const m = scaleMean(ls, 'energy');
      return m !== null && m <= LOW_SCALE_CUTOFF;
    },
    phrase: (c, d) => `Your energy tends to run low around now — in ${c} of ${d} past ${cyclesWord(d)}.`,
    suggestion: 'Your pattern shows lower energy around now — a lighter schedule might feel better.',
  },
  {
    signal: 'sleep',
    logged: (ls) => scaleMean(ls, 'sleep_quality') !== null,
    exhibits: (ls) => {
      const m = scaleMean(ls, 'sleep_quality');
      return m !== null && m <= LOW_SCALE_CUTOFF;
    },
    phrase: (c, d) => `Your sleep quality tends to dip around now — in ${c} of ${d} past ${cyclesWord(d)}.`,
    suggestion: 'Your pattern shows poorer sleep around now — a wind-down routine could help.',
  },
  {
    signal: 'mood',
    logged: (ls) => logsCategory(ls, ['mood']),
    exhibits: hasLowMoodDay,
    phrase: (c, d) => `Your mood has often dipped around now — in ${c} of ${d} past ${cyclesWord(d)}.`,
    suggestion: 'Your pattern shows mood dips around now — be gentle with yourself today.',
  },
  {
    signal: 'pain',
    logged: (ls) => logsCategory(ls, PAIN_CATEGORIES),
    exhibits: hasPainDay,
    phrase: (c, d) => `You've often logged pain around now — in ${c} of ${d} past ${cyclesWord(d)}.`,
    suggestion: 'Your pattern shows pain around now — you might prepare what usually helps you.',
  },
];

export function todayOutlook(logs: DailyLog[], todayISO: string): TodayOutlook | null {
  const starts = extractPeriodStarts(logs);
  if (starts.length === 0) return null;

  const avg = averageCycleLength(starts);
  const todayPos = cyclePositionFor(starts, todayISO, avg);
  if (!todayPos) return null;

  const { cycleDay, phase, cycleId: currentCycleId } = todayPos;

  // Group past-cycle logs that fall in the same cycle-day window (± radius).
  const window = new Map<string, DailyLog[]>();
  for (const log of logs) {
    const pos = cyclePositionFor(starts, log.date, avg);
    if (!pos || pos.cycleId === currentCycleId) continue; // exclude the open cycle
    if (Math.abs(pos.cycleDay - cycleDay) > OUTLOOK_WINDOW_RADIUS) continue;
    const bucket = window.get(pos.cycleId);
    if (bucket) bucket.push(log);
    else window.set(pos.cycleId, [log]);
  }

  const pastCycles = window.size;
  const dataBasis =
    pastCycles === 0
      ? 'Keep logging to see your patterns here'
      : `Based on ${pastCycles} past ${cyclesWord(pastCycles)}`;

  if (pastCycles < MIN_CYCLES_FOR_OUTLOOK) {
    return { cycleDay, phase, observations: [], suggestion: null, dataBasis };
  }

  const suggestions: Record<Observation['signal'], string> = {
    energy: '', sleep: '', mood: '', pain: '',
  };
  const candidates: Observation[] = [];

  for (const def of SIGNALS) {
    let denom = 0;
    let count = 0;
    for (const cycleLogs of window.values()) {
      if (!def.logged(cycleLogs)) continue;
      denom++;
      if (def.exhibits(cycleLogs)) count++;
    }
    if (denom > 0 && count >= MIN_CYCLES_FOR_OUTLOOK && count / denom >= OUTLOOK_MAJORITY_RATIO) {
      candidates.push({ signal: def.signal, pattern: def.phrase(count, denom), cyclesObserved: count });
      suggestions[def.signal] = def.suggestion;
    }
  }

  const observations = candidates
    .sort((a, b) => b.cyclesObserved - a.cyclesObserved || a.signal.localeCompare(b.signal))
    .slice(0, 2);

  return {
    cycleDay,
    phase,
    observations,
    suggestion: observations.length ? suggestions[observations[0].signal] : null,
    dataBasis,
  };
}
