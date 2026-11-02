import {
  DRSP_ITEM_COUNT,
  DRSP_MIN,
  DRSP_MAX,
  type DrspEntry,
  type CycleSeverity,
  type MoodSafeguard,
} from '../types/mood';
import { averageCycleLength, cyclePositionFor } from './cycle';

/**
 * DRSP mood scoring + the PMDD-aware safeguard (F2-10).
 *
 * Pure, framework-free, on-device. This is deliberately careful: no streaks, no
 * "scores", no gamification — just an honest severity aggregation and a single,
 * dismissible nudge to talk to a clinician when a genuinely severe pattern persists.
 * Mood↔cycle correlation itself is NOT reimplemented here — the F2-07 engine and the
 * F2-08 outlook already cover "mood dips before your period"; this module owns only
 * the structured DRSP record and its safeguard.
 */

/** A cycle's mean DRSP severity at/above this is "severe". */
export const SEVERE_SEVERITY_THRESHOLD = 4;
/** The safeguard only triggers once a severe pattern holds across this many cycles. */
export const MIN_SEVERE_CYCLES = 3;

export function isValidDrspEntry(entry: DrspEntry): boolean {
  return (
    entry.scores.length === DRSP_ITEM_COUNT &&
    entry.scores.every((s) => Number.isFinite(s) && s >= DRSP_MIN && s <= DRSP_MAX)
  );
}

/** Mean severity for one day's DRSP record. Returns null for an invalid entry. */
export function drspDailyMean(entry: DrspEntry): number | null {
  if (!isValidDrspEntry(entry)) return null;
  return entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
}

/**
 * Group valid DRSP entries by the cycle they fall in and return each cycle's mean
 * daily severity. Entries before the first tracked cycle (or in an implausibly long
 * open cycle) are skipped. `starts` are the period-start dates (extractPeriodStarts).
 */
export function severityByCycle(entries: DrspEntry[], starts: string[]): CycleSeverity[] {
  if (starts.length === 0) return [];
  const avg = averageCycleLength(starts);

  const byCycle = new Map<string, number[]>();
  for (const entry of entries) {
    const mean = drspDailyMean(entry);
    if (mean === null) continue;
    const pos = cyclePositionFor(starts, entry.date, avg);
    if (!pos) continue;
    const bucket = byCycle.get(pos.cycleId);
    if (bucket) bucket.push(mean);
    else byCycle.set(pos.cycleId, [mean]);
  }

  return [...byCycle.entries()]
    .map(([cycleId, means]) => ({
      cycleId,
      meanSeverity: means.reduce((a, b) => a + b, 0) / means.length,
      entryCount: means.length,
    }))
    .sort((a, b) => a.cycleId.localeCompare(b.cycleId));
}

/**
 * Evaluate the PMDD-aware safeguard. Triggers only when at least MIN_SEVERE_CYCLES
 * cycles have a mean severity at/above SEVERE_SEVERITY_THRESHOLD — and never when the
 * user has already dismissed it (dismissal is remembered indefinitely by the caller).
 *
 * This is support, not diagnosis: the basis sentence is phrased accordingly.
 */
export function evaluateMoodSafeguard(
  entries: DrspEntry[],
  starts: string[],
  dismissed = false,
): MoodSafeguard {
  const severeCycles = severityByCycle(entries, starts).filter(
    (c) => c.meanSeverity >= SEVERE_SEVERITY_THRESHOLD,
  ).length;

  const triggered = !dismissed && severeCycles >= MIN_SEVERE_CYCLES;

  const basis = triggered
    ? `These patterns have been strong across ${severeCycles} cycles and may be worth discussing with a doctor.`
    : 'Keep logging — nothing here needs action right now.';

  return { triggered, severeCycles, basis };
}
