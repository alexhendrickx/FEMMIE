import type { DailyLog } from '../types/logging';
import type { CyclePhase, Prediction } from '../types/cycle';

const MAX_INTRA_PERIOD_GAP = 2; // days
const MIN_CYCLE_GAP = 15;       // days

function parseUTC(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`);
}

function daysBetween(a: string, b: string): number {
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
