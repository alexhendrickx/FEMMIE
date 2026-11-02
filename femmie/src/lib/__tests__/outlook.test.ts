import {
  todayOutlook,
  MIN_CYCLES_FOR_OUTLOOK,
  OUTLOOK_WINDOW_RADIUS,
} from '../outlook';
import type { DailyLog, LogEntry } from '../../types/logging';

const DAY = 86400000;
const START = '2026-01-01';
const CYCLE = 28;
const isoAt = (off: number) =>
  new Date(Date.parse(`${START}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);

function makeLog(date: string, entries: LogEntry[]): DailyLog {
  return { date, cycleDay: 1, entries, savedAt: `${date}T00:00:00.000Z` };
}

/** `cycleCount` regular 28-day cycles; symptoms dropped at a day-offset in given cycles. */
function build(cycleCount: number, extra: { dayOffset: number; cycles: number[]; entry: LogEntry }[] = []): DailyLog[] {
  const logs: DailyLog[] = [];
  for (let c = 0; c < cycleCount; c++) {
    for (let d = 0; d < 4; d++) logs.push(makeLog(isoAt(c * CYCLE + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
  }
  for (const e of extra) for (const c of e.cycles) logs.push(makeLog(isoAt(c * CYCLE + e.dayOffset), [e.entry]));
  return logs;
}

test('returns null when there is no cycle history', () => {
  expect(todayOutlook([], isoAt(10))).toBeNull();
});

test('neutral placeholder (no observations) with fewer than MIN_CYCLES of data', () => {
  // 2 cycles only; today is in the open (3rd) cycle at ~day 15
  const logs = build(3, [
    { dayOffset: 14, cycles: [0, 1], entry: { categoryId: 'energy', value: 1 } },
  ]);
  const todayDay15 = isoAt(2 * CYCLE + 14); // cycleDay ~15 of the open cycle
  const outlook = todayOutlook(logs, todayDay15)!;
  expect(outlook.observations).toEqual([]);
  expect(outlook.suggestion).toBeNull();
  expect(MIN_CYCLES_FOR_OUTLOOK).toBe(3);
});

test('surfaces a low-energy observation when it holds across >=3 past cycles', () => {
  // low energy logged on day ~15 across 4 past cycles; today is day ~15 of the open cycle
  const logs = build(5, [
    { dayOffset: 14, cycles: [0, 1, 2, 3], entry: { categoryId: 'energy', value: 1 } },
  ]);
  const today = isoAt(4 * CYCLE + 14);
  const outlook = todayOutlook(logs, today)!;
  const energy = outlook.observations.find((o) => o.signal === 'energy');
  expect(energy).toBeDefined();
  expect(energy!.cyclesObserved).toBe(4);
  expect(outlook.suggestion).toContain('energy');
  expect(outlook.dataBasis).toContain('past cycles');
});

test('respects the ±window: a signal logged far from today is not counted', () => {
  // energy dips logged near day 2 (start), but today is day ~20 — outside the ±2 window
  const logs = build(5, [
    { dayOffset: 1, cycles: [0, 1, 2, 3], entry: { categoryId: 'energy', value: 1 } },
  ]);
  const today = isoAt(4 * CYCLE + 19); // ~day 20
  const outlook = todayOutlook(logs, today)!;
  expect(outlook.observations.find((o) => o.signal === 'energy')).toBeUndefined();
  expect(OUTLOOK_WINDOW_RADIUS).toBe(2);
});

test('caps observations at 2, strongest first', () => {
  const logs = build(6, [
    { dayOffset: 14, cycles: [0, 1, 2, 3, 4], entry: { categoryId: 'energy', value: 1 } }, // 5 cycles
    { dayOffset: 14, cycles: [0, 1, 2, 3], entry: { categoryId: 'cramps', value: 5 } }, // 4 cycles (pain)
    { dayOffset: 14, cycles: [0, 1, 2], entry: { categoryId: 'mood', value: 'low' } }, // 3 cycles
  ]);
  const today = isoAt(5 * CYCLE + 14);
  const outlook = todayOutlook(logs, today)!;
  expect(outlook.observations.length).toBe(2);
  expect(outlook.observations[0].signal).toBe('energy'); // most cycles → first
  expect(outlook.observations[1].signal).toBe('pain');
});

test('excludes the current open cycle from the pattern count', () => {
  // energy dip in 3 past cycles + also today — the count should be the 3 PAST cycles
  const logs = build(5, [
    { dayOffset: 14, cycles: [0, 1, 2], entry: { categoryId: 'energy', value: 1 } },
    { dayOffset: 14, cycles: [4], entry: { categoryId: 'energy', value: 1 } }, // current/open cycle
  ]);
  const today = isoAt(4 * CYCLE + 14);
  const outlook = todayOutlook(logs, today)!;
  const energy = outlook.observations.find((o) => o.signal === 'energy')!;
  expect(energy.cyclesObserved).toBe(3); // the open cycle's own log doesn't inflate it
});
