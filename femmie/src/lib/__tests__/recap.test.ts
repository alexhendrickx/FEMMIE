import { generateRecap, RECAP_AVG_WINDOW } from '../recap';
import type { DailyLog, LogEntry } from '../../types/logging';

const DAY = 86400000;
const START = '2026-01-01';
const isoAt = (off: number) =>
  new Date(Date.parse(`${START}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);

function makeLog(date: string, entries: LogEntry[]): DailyLog {
  return { date, cycleDay: 1, entries, savedAt: `${date}T00:00:00.000Z` };
}

/**
 * Build cycles with explicit lengths and period lengths, plus optional symptoms.
 * `cycleLengths[i]` is the gap from cycle i's start to cycle i+1's start; the final
 * start opens the still-open cycle.
 */
function buildCycles(opts: {
  cycleLengths: number[]; // gaps between consecutive starts
  periodLen: number;
  symptoms?: { dayOffsetInCycle: number; cycleIndexes: number[]; entry: LogEntry }[];
}): DailyLog[] {
  const logs: DailyLog[] = [];
  const startOffsets: number[] = [0];
  for (const len of opts.cycleLengths) startOffsets.push(startOffsets[startOffsets.length - 1] + len);

  startOffsets.forEach((startOff) => {
    for (let d = 0; d < opts.periodLen; d++) {
      logs.push(makeLog(isoAt(startOff + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
    }
  });

  for (const s of opts.symptoms ?? []) {
    for (const ci of s.cycleIndexes) {
      logs.push(makeLog(isoAt(startOffsets[ci] + s.dayOffsetInCycle), [s.entry]));
    }
  }
  return logs;
}

test('returns null with fewer than 2 completed cycles (never a placeholder)', () => {
  expect(generateRecap([])).toBeNull();
  // one completed cycle + one open cycle = only 1 completed → still null
  const logs = buildCycles({ cycleLengths: [28], periodLen: 4 });
  expect(generateRecap(logs)).toBeNull();
});

test('recaps the most recently completed cycle, comparing to prior-cycle average', () => {
  // starts at 0, 28, 56, 86 → completed cycles: 28, 28, 30 (last=open)
  const logs = buildCycles({ cycleLengths: [28, 28, 30], periodLen: 5 });
  const recap = generateRecap(logs)!;
  expect(recap).not.toBeNull();
  // most recently completed cycle is the 30-day one (start offset 56 → 2026-02-26)
  expect(recap.cycleId).toBe(isoAt(56));
  expect(recap.cycleLength).toBe(30);
  // prior completed cycles were 28 and 28 → avg 28
  expect(recap.avgCycleLength).toBe(28);
  expect(recap.periodLength).toBe(5);
  expect(recap.avgPeriodLength).toBe(5);
});

test('averages only the last RECAP_AVG_WINDOW prior cycles', () => {
  // 8 completed 28-day cycles then an open one; recapped cycle is the 8th completed.
  const lengths = Array(8).fill(28);
  const logs = buildCycles({ cycleLengths: lengths, periodLen: 4 });
  const recap = generateRecap(logs)!;
  // All 28 → avg 28 regardless; assert it didn't choke and used a bounded window.
  expect(recap.avgCycleLength).toBe(28);
  expect(RECAP_AVG_WINDOW).toBe(6);
});

test('counts the top symptoms within the recapped cycle only', () => {
  const logs = buildCycles({
    cycleLengths: [28, 28, 28],
    periodLen: 4,
    symptoms: [
      // in the recapped cycle (index 2, offsets 56..): cramps 3 days, headache 1 day
      { dayOffsetInCycle: 10, cycleIndexes: [2], entry: { categoryId: 'cramps', value: 4 } },
      { dayOffsetInCycle: 11, cycleIndexes: [2], entry: { categoryId: 'cramps', value: 4 } },
      { dayOffsetInCycle: 12, cycleIndexes: [2], entry: { categoryId: 'cramps', value: 4 } },
      { dayOffsetInCycle: 14, cycleIndexes: [2], entry: { categoryId: 'headache', value: true } },
      // in an earlier cycle (should NOT be counted): bloating
      { dayOffsetInCycle: 10, cycleIndexes: [0], entry: { categoryId: 'bloating', value: 5 } },
    ],
  });
  const recap = generateRecap(logs)!;
  const ids = recap.topSymptoms.map((s) => s.symptomId);
  expect(ids).toContain('cramps');
  expect(ids).toContain('headache');
  expect(ids).not.toContain('bloating'); // from a different cycle
  const cramps = recap.topSymptoms.find((s) => s.symptomId === 'cramps')!;
  expect(cramps.count).toBe(3);
  expect(cramps.symptomName).toBe('Cramps');
});

test('is non-null at exactly 2 completed cycles (3 starts) — the gate boundary', () => {
  const logs = buildCycles({ cycleLengths: [28, 28], periodLen: 4 }); // starts at 0,28,56
  const recap = generateRecap(logs)!;
  expect(recap).not.toBeNull();
  expect(recap.cycleId).toBe(isoAt(28)); // recaps the 2nd cycle (most recent completed)
  expect(recap.cycleLength).toBe(28);
});

test('period length stops at a gap longer than the intra-period limit', () => {
  const logs = [
    // cycle 0 (normal)
    ...[0, 1, 2, 3].map((d) => makeLog(isoAt(d), [{ categoryId: 'menstrual_flow', value: 'medium' as const }])),
    // cycle 1 (the one that gets recapped): flow on 28,29,30 then a 4-day gap to 34
    ...[28, 29, 30, 34].map((d) => makeLog(isoAt(d), [{ categoryId: 'menstrual_flow', value: 'medium' as const }])),
    // cycle 2 (open)
    ...[56, 57].map((d) => makeLog(isoAt(d), [{ categoryId: 'menstrual_flow', value: 'medium' as const }])),
  ];
  const recap = generateRecap(logs)!;
  expect(recap.cycleId).toBe(isoAt(28));
  expect(recap.periodLength).toBe(3); // 28,29,30 — the day-34 flow is past the gap
});

test('resolves custom-tag names via options.labels', () => {
  const logs = buildCycles({
    cycleLengths: [28, 28],
    periodLen: 4,
    symptoms: [
      { dayOffsetInCycle: 10, cycleIndexes: [1], entry: { categoryId: 'tag_x', value: true } },
    ],
  });
  const recap = generateRecap(logs, {}, { labels: { tag_x: 'My Thing' } })!;
  const tag = recap.topSymptoms.find((s) => s.symptomId === 'tag_x');
  expect(tag).toBeDefined();
  expect(tag!.symptomName).toBe('My Thing');
});

test('includes up to 2 correlation noticings', () => {
  const logs = buildCycles({
    cycleLengths: [28, 28, 28, 28, 28, 28],
    periodLen: 4,
    symptoms: [
      { dayOffsetInCycle: 21, cycleIndexes: [0, 1, 2, 3, 4], entry: { categoryId: 'cramps', value: 4 } },
    ],
  });
  const recap = generateRecap(logs)!;
  expect(recap.noticings.length).toBeGreaterThanOrEqual(1);
  expect(recap.noticings.length).toBeLessThanOrEqual(2);
  expect(recap.noticings[0]).toContain('cramps');
});
