import type { DailyLog } from '../types/logging';
import type { CyclePhase, Prediction } from '../types/cycle';

export const MAX_INTRA_PERIOD_GAP = 2; // days — longest gap between flow days within one period
const MIN_CYCLE_GAP = 15;       // days

function parseUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseUTC(b) - parseUTC(a)) / 86400000);
}

function addDays(iso: string, days: number): string {
  const d = new Date(parseUTC(iso) + days * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function extractPeriodStarts(logs: DailyLog[]): string[] {
  const periodDays = logs
    .filter((log) => log.entries.some((e) => e.categoryId === 'menstrual_flow'))
    .map((log) => log.date)
    .sort();

  if (periodDays.length === 0) return [];

  const starts: string[] = [periodDays[0]];
  let lastPeriodDay = periodDays[0];
  let lastStart = periodDays[0];

  for (let i = 1; i < periodDays.length; i++) {
    const day = periodDays[i];
    if (daysBetween(lastPeriodDay, day) > MAX_INTRA_PERIOD_GAP) {
      if (daysBetween(lastStart, day) >= MIN_CYCLE_GAP) {
        starts.push(day);
        lastStart = day;
      }
    }
    lastPeriodDay = day;
  }
  return starts;
}

export function cycleLengths(starts: string[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    out.push(daysBetween(starts[i - 1], starts[i]));
  }
  return out;
}

export function currentCycleDay(starts: string[], todayISO: string): number | null {
  if (starts.length === 0) return null;
  const lastStart = starts[starts.length - 1];
  return daysBetween(lastStart, todayISO) + 1;
}

export function cyclePhase(cycleDay: number, avgLength: number): CyclePhase {
  if (cycleDay >= 1 && cycleDay <= 5) return 'period';
  const ovulationDay = avgLength - 14;
  const fertileStart = Math.max(6, Math.round(ovulationDay - 2));
  const fertileEnd = Math.max(fertileStart, Math.round(ovulationDay + 2));
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile';
  if (cycleDay < fertileStart) return 'follicular';
  return 'luteal';
}

export interface CyclePosition {
  /** The period-start ISO date that opens the cycle this date belongs to. */
  cycleId: string;
  /** 1-based day within that cycle. */
  cycleDay: number;
  phase: CyclePhase;
}

/**
 * Locate which cycle a given date falls in and its phase. `starts` must be
 * ascending (as {@link extractPeriodStarts} returns it) — the early break relies on it.
 *
 * Pure date math — no device/network. Phase uses the cycle's ACTUAL length when the
 * cycle is completed (a later start exists); the open cycle falls back to `avgLength`.
 * Returns null when (a) the date predates the first recorded period start, or (b) the
 * date lands in an implausibly long OPEN cycle (an un-tracked gap — pregnancy, a break
 * in logging), where the phase is genuinely unknown rather than "luteal forever".
 */
export function cyclePositionFor(
  starts: string[],
  dateISO: string,
  avgLength: number,
): CyclePosition | null {
  if (starts.length === 0) return null;
  if (daysBetween(starts[0], dateISO) < 0) return null; // before first tracked cycle

  // Index of the last start that is on or before the date.
  let i = 0;
  for (let k = 0; k < starts.length; k++) {
    if (daysBetween(starts[k], dateISO) >= 0) i = k;
    else break;
  }

  const cycleId = starts[i];
  const cycleDay = daysBetween(cycleId, dateISO) + 1;
  const nextStart = starts[i + 1];

  if (nextStart) {
    // Completed cycle: its true length anchors the phase boundaries.
    const actualLength = daysBetween(cycleId, nextStart);
    return { cycleId, cycleDay, phase: cyclePhase(cycleDay, actualLength) };
  }

  // Open (most recent) cycle: cap at 1.5× the average before the phase is unknowable.
  if (cycleDay > Math.round(avgLength * 1.5)) return null;
  return { cycleId, cycleDay, phase: cyclePhase(cycleDay, avgLength) };
}

/** Mean cycle length, falling back to a neutral 28 when history is too thin. */
export function averageCycleLength(starts: string[]): number {
  const lengths = cycleLengths(starts);
  if (lengths.length === 0) return 28;
  return lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

export function predictNextPeriod(starts: string[], todayISO: string): Prediction {
  const lengths = cycleLengths(starts);

  if (lengths.length < 2) {
    return { confidence: 'low', basis: 'Not enough cycles logged yet' };
  }

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + (l - avg) ** 2, 0) / lengths.length;
  const stddev = Math.sqrt(variance);

  const lastStart = starts[starts.length - 1];
  const mostLikely = addDays(lastStart, Math.round(avg));
  const windowRadius = Math.max(1, Math.round(stddev));
  const windowStart = addDays(mostLikely, -windowRadius);
  const windowEnd = addDays(mostLikely, windowRadius);

  let confidence: Prediction['confidence'];
  if (stddev > 5) {
    confidence = 'low';
  } else if (lengths.length >= 6 && stddev <= 3) {
    confidence = 'high';
  } else {
    confidence = 'medium';
  }

  const basis = `Based on your last ${lengths.length} cycles · avg ${Math.round(avg)} days ±${windowRadius}`;

  return { confidence, mostLikely, windowStart, windowEnd, basis };
}
