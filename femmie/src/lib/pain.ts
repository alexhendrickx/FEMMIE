import type { CyclePhase } from '../types/cycle';
import {
  BODY_REGIONS,
  PAIN_INTENSITY_MIN,
  PAIN_INTENSITY_MAX,
  MED_EFFECTIVENESS_MIN,
  MED_EFFECTIVENESS_MAX,
  type PainEvent,
  type BodyRegion,
  type LocationCount,
  type MedicationStat,
} from '../types/pain';
import { extractPeriodStarts, averageCycleLength, cyclePositionFor } from './cycle';

/**
 * Pain-event aggregation for insights + clinician export (F2-11).
 *
 * Pure, framework-free, on-device. Produces the numbers a gynae/neuro appointment
 * export needs: top locations, average intensity by cycle phase, and which
 * medications actually helped. Phase/trigger CORRELATION reuses the F2-07 engine via
 * the generic log pipeline; this module owns the pain-event-specific shape.
 */

const REGION_SET: ReadonlySet<string> = new Set(BODY_REGIONS);

export function isValidPainEvent(event: PainEvent): boolean {
  if (!Number.isFinite(event.intensity)) return false;
  if (event.intensity < PAIN_INTENSITY_MIN || event.intensity > PAIN_INTENSITY_MAX) return false;
  if (!Number.isFinite(event.durationMin) || event.durationMin < 0) return false;
  if (!event.locations.every((r) => REGION_SET.has(r))) return false;
  return event.medications.every(
    (m) =>
      m.name.trim().length > 0 &&
      Number.isFinite(m.effectiveness) &&
      m.effectiveness >= MED_EFFECTIVENESS_MIN &&
      m.effectiveness <= MED_EFFECTIVENESS_MAX,
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Most-reported body regions across events, most frequent first. */
export function topLocations(events: PainEvent[], limit = 3): LocationCount[] {
  const counts = new Map<BodyRegion, number>();
  for (const e of events) {
    for (const region of e.locations) {
      counts.set(region, (counts.get(region) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count || a.region.localeCompare(b.region))
    .slice(0, limit);
}

export type PhaseIntensity = Record<CyclePhase, { avgIntensity: number; count: number }>;

const emptyPhaseIntensity = (): PhaseIntensity => ({
  period: { avgIntensity: 0, count: 0 },
  follicular: { avgIntensity: 0, count: 0 },
  fertile: { avgIntensity: 0, count: 0 },
  luteal: { avgIntensity: 0, count: 0 },
});

/** Average pain intensity grouped by the cycle phase each event occurred in. */
export function avgIntensityByPhase(events: PainEvent[], starts: string[]): PhaseIntensity {
  const sums = emptyPhaseIntensity();
  if (starts.length === 0) return sums;
  const avg = averageCycleLength(starts);

  const totals: Record<CyclePhase, number> = { period: 0, follicular: 0, fertile: 0, luteal: 0 };
  for (const e of events) {
    const pos = cyclePositionFor(starts, e.date, avg);
    if (!pos) continue;
    totals[pos.phase] += e.intensity;
    sums[pos.phase].count += 1;
  }
  for (const phase of Object.keys(sums) as CyclePhase[]) {
    const { count } = sums[phase];
    sums[phase].avgIntensity = count > 0 ? round1(totals[phase] / count) : 0;
  }
  return sums;
}

/** Per-medication: how often it was tried and how well it worked on average. */
export function medicationStats(events: PainEvent[]): MedicationStat[] {
  const agg = new Map<string, { total: number; count: number; name: string }>();
  for (const e of events) {
    for (const m of e.medications) {
      const key = m.name.trim().toLowerCase();
      const existing = agg.get(key);
      if (existing) {
        existing.total += m.effectiveness;
        existing.count += 1;
      } else {
        agg.set(key, { total: m.effectiveness, count: 1, name: m.name.trim() });
      }
    }
  }
  return [...agg.values()]
    .map((a) => ({ name: a.name, timesTried: a.count, avgEffectiveness: round1(a.total / a.count) }))
    .sort((a, b) => b.avgEffectiveness - a.avgEffectiveness || b.timesTried - a.timesTried);
}

export interface PainSummary {
  totalEvents: number;
  avgIntensity: number;
  topLocations: LocationCount[];
  byPhase: PhaseIntensity;
  medications: MedicationStat[];
  dateRange: { from: string; to: string } | null;
}

/**
 * Build the full export summary from raw pain events. Invalid events are dropped so a
 * bad record can't skew a clinical export. Derives period-starts from the provided
 * cycle logs (period-start dates) for the phase breakdown.
 */
export function painSummary(events: PainEvent[], starts: string[]): PainSummary {
  const valid = events.filter(isValidPainEvent);
  const sorted = [...valid].sort((a, b) => a.date.localeCompare(b.date));

  const avgIntensity =
    valid.length > 0 ? round1(valid.reduce((s, e) => s + e.intensity, 0) / valid.length) : 0;

  return {
    totalEvents: valid.length,
    avgIntensity,
    topLocations: topLocations(valid),
    byPhase: avgIntensityByPhase(valid, starts),
    medications: medicationStats(valid),
    dateRange:
      sorted.length > 0 ? { from: sorted[0].date, to: sorted[sorted.length - 1].date } : null,
  };
}

/** Convenience: derive period-starts from cycle logs for callers holding DailyLogs. */
export { extractPeriodStarts };
