import {
  computeCorrelations,
  surfaceCorrelations,
  isPresent,
  MIN_CYCLES_FOR_PATTERN,
} from '../correlation';
import type { DailyLog, LogEntry } from '../../types/logging';

const DAY_MS = 86400000;

function iso(baseISO: string, offsetDays: number): string {
  const d = new Date(Date.parse(`${baseISO}T00:00:00Z`) + offsetDays * DAY_MS);
  return d.toISOString().slice(0, 10);
}

function makeLog(date: string, entries: LogEntry[]): DailyLog {
  return { date, cycleDay: 1, entries, savedAt: `${date}T00:00:00.000Z` };
}

/**
 * Build `cycleCount` regular 28-day cycles starting 2026-01-01, each with a
 * 4-day period (defines the cycle), then let the caller drop symptoms on a
 * given day-offset within chosen cycles.
 */
function buildHistory(opts: {
  cycleCount: number;
  symptoms?: { dayOffset: number; cycles: number[]; entry: LogEntry }[];
}): DailyLog[] {
  const START = '2026-01-01';
  const CYCLE_LEN = 28;
  const logs: DailyLog[] = [];

  for (let c = 0; c < opts.cycleCount; c++) {
    const cycleStart = c * CYCLE_LEN;
    // period days 1..4
    for (let d = 0; d < 4; d++) {
      logs.push(makeLog(iso(START, cycleStart + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
    }
  }

  for (const s of opts.symptoms ?? []) {
    for (const c of s.cycles) {
      logs.push(makeLog(iso(START, c * CYCLE_LEN + s.dayOffset), [s.entry]));
    }
  }

  return logs;
}

describe('isPresent', () => {
  test('booleans: true is present, false is not', () => {
    expect(isPresent(true)).toBe(true);
    expect(isPresent(false)).toBe(false);
  });
  test('scales: present at/above threshold (3)', () => {
    expect(isPresent(1)).toBe(false);
    expect(isPresent(2)).toBe(false);
    expect(isPresent(3)).toBe(true);
    expect(isPresent(5)).toBe(true);
  });
  test('mood: only low/bad count as present', () => {
    expect(isPresent('low')).toBe(true);
    expect(isPresent('bad')).toBe(true);
    expect(isPresent('great')).toBe(false);
    expect(isPresent('okay')).toBe(false);
  });
});

describe('computeCorrelations', () => {
  test('returns empty array when there is no data (never throws)', () => {
    expect(computeCorrelations([])).toEqual([]);
    expect(surfaceCorrelations([])).toEqual([]);
  });

  test('buckets a luteal-clustered symptom into the luteal phase across cycles', () => {
    // day offset 21 → cycleDay 22 → luteal phase in a 28-day cycle
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'cramps', value: 4 } },
      ],
    });

    const [cramps] = computeCorrelations(logs).filter((c) => c.symptomId === 'cramps');
    expect(cramps).toBeDefined();
    expect(cramps.occurrences).toBe(5);
    expect(cramps.cyclesObserved).toBe(5);
    expect(cramps.dominantPhase).toBe('luteal');
    expect(cramps.cyclesInDominant).toBe(5);
    expect(cramps.confidence).toBe('sufficient');
    expect(cramps.phaseCounts.luteal).toBe(5);
    expect(cramps.phaseCounts.follicular).toBe(0);
  });

  test('scale entries below the intensity threshold are not occurrences', () => {
    const logs = buildHistory({
      cycleCount: 4,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2], entry: { categoryId: 'bloating', value: 2 } },
      ],
    });
    expect(computeCorrelations(logs).some((c) => c.symptomId === 'bloating')).toBe(false);
  });

  test('cycle-defining entries (flow) are not treated as symptoms', () => {
    const logs = buildHistory({ cycleCount: 4 });
    const ids = computeCorrelations(logs).map((c) => c.symptomId);
    expect(ids).not.toContain('menstrual_flow');
    expect(ids).not.toContain('spotting');
  });

  test('neutral/positive lifestyle signals are NOT counted as symptoms', () => {
    // sleep_hours (bare number) and energy/sleep_quality (high = good) must never
    // surface as "symptom occurrences" — this was the blocking bug caught in review.
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'sleep_hours', value: 7 } },
        { dayOffset: 20, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'energy', value: 5 } },
        { dayOffset: 19, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'sleep_quality', value: 4 } },
      ],
    });
    const ids = computeCorrelations(logs).map((c) => c.symptomId);
    expect(ids).not.toContain('sleep_hours');
    expect(ids).not.toContain('energy');
    expect(ids).not.toContain('sleep_quality');
  });

  test('a custom isSymptom override changes eligibility', () => {
    const logs = buildHistory({
      cycleCount: 4,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2], entry: { categoryId: 'sleep_hours', value: 7 } },
      ],
    });
    const withOverride = computeCorrelations(logs, {
      isSymptom: (id) => id === 'sleep_hours',
    });
    expect(withOverride.map((c) => c.symptomId)).toContain('sleep_hours');
  });

  test('dominant phase ties resolve to the earlier phase deterministically', () => {
    const logs = buildHistory({
      cycleCount: 4,
      symptoms: [
        { dayOffset: 8, cycles: [0], entry: { categoryId: 'nausea', value: true } }, // follicular
        { dayOffset: 21, cycles: [1], entry: { categoryId: 'nausea', value: true } }, // luteal
      ],
    });
    const nausea = computeCorrelations(logs).find((c) => c.symptomId === 'nausea')!;
    expect(nausea.phaseCounts.follicular).toBe(1);
    expect(nausea.phaseCounts.luteal).toBe(1);
    expect(nausea.dominantPhase).toBe('follicular'); // earlier in PHASES order
  });

  test('a pattern in fewer than MIN_CYCLES cycles is flagged low_sample', () => {
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        { dayOffset: 8, cycles: [0, 1], entry: { categoryId: 'headache', value: true } },
      ],
    });
    const headache = computeCorrelations(logs).find((c) => c.symptomId === 'headache')!;
    expect(headache.cyclesObserved).toBeLessThan(MIN_CYCLES_FOR_PATTERN);
    expect(headache.confidence).toBe('low_sample');
  });

  test('uses supplied labels (e.g. custom tags) in name + pattern sentence', () => {
    const logs = buildHistory({
      cycleCount: 4,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2], entry: { categoryId: 'tag_brainfog', value: true } },
      ],
    });
    const c = computeCorrelations(logs, { labels: { tag_brainfog: 'Brain fog' } }).find(
      (x) => x.symptomId === 'tag_brainfog',
    )!;
    expect(c.symptomName).toBe('Brain fog');
    expect(c.pattern).toContain('brain fog');
    expect(c.pattern).toContain('luteal');
  });
});

describe('surfaceCorrelations', () => {
  test('only surfaces sufficient-sample patterns', () => {
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'cramps', value: 4 } },
        { dayOffset: 8, cycles: [0, 1], entry: { categoryId: 'headache', value: true } },
      ],
    });
    const surfaced = surfaceCorrelations(logs).map((c) => c.symptomId);
    expect(surfaced).toContain('cramps');
    expect(surfaced).not.toContain('headache');
  });

  test('"not relevant" feedback hides a pattern from future surfacing', () => {
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'cramps', value: 4 } },
      ],
    });
    const hidden = surfaceCorrelations(logs, { cramps: { helpful: false } });
    expect(hidden.map((c) => c.symptomId)).not.toContain('cramps');

    const kept = surfaceCorrelations(logs, { cramps: { helpful: true } });
    expect(kept.map((c) => c.symptomId)).toContain('cramps');
  });

  test('sorts the most concentrated pattern first', () => {
    const logs = buildHistory({
      cycleCount: 6,
      symptoms: [
        // cramps: all 5 occurrences luteal → fully concentrated
        { dayOffset: 21, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'cramps', value: 4 } },
        // fatigue: spread across follicular + luteal → less concentrated
        { dayOffset: 8, cycles: [0, 1, 2], entry: { categoryId: 'fatigue', value: 4 } },
        { dayOffset: 21, cycles: [3, 4, 5], entry: { categoryId: 'fatigue', value: 4 } },
      ],
    });
    const surfaced = surfaceCorrelations(logs);
    expect(surfaced[0].symptomId).toBe('cramps');
  });

  test('ignores logs dated before the first tracked cycle', () => {
    const logs = buildHistory({
      cycleCount: 4,
      symptoms: [
        { dayOffset: 21, cycles: [0, 1, 2], entry: { categoryId: 'cramps', value: 4 } },
      ],
    });
    // a stray symptom 10 days before the first period start — no known phase
    logs.push(makeLog(iso('2026-01-01', -10), [{ categoryId: 'cramps', value: 5 }]));
    const cramps = computeCorrelations(logs).find((c) => c.symptomId === 'cramps')!;
    expect(cramps.occurrences).toBe(3); // the pre-history day is skipped
  });
});
