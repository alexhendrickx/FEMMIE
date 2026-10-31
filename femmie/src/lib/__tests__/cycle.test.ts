/*
 * HUMAN-VERIFY (criterion 9, device-only):
 * - Open the app on a simulator/device → Home tab shows the cycle ring above the calendar,
 *   above the existing 'Log today' FAB.
 * - Tap the ring → the daily-log sheet opens (same sheet the FAB opens).
 * - With no logs, the ring shows '—' and 'No data yet' is the phase label fallback
 *   and the prediction line reads 'Log your period to see predictions'.
 * - Log a single period → prediction line reads 'Low confidence — keep logging'.
 * - Log 2+ regular cycles via the daily-log sheet (or inspect via useLogStore in dev tools)
 *   → prediction line shows 'Next period ~ <date>' with a sub-range and basis line.
 */

import {
  extractPeriodStarts,
  cycleLengths,
  currentCycleDay,
  cyclePhase,
  predictNextPeriod,
} from '../cycle';
import type { DailyLog } from '../../types/logging';

function makeLog(date: string, flow = true): DailyLog {
  return {
    date,
    cycleDay: 1,
    entries: flow ? [{ categoryId: 'menstrual_flow', value: 'medium' }] : [],
    savedAt: `${date}T00:00:00.000Z`,
  };
}

test('extractPeriodStarts returns one start per cycle, sorted ascending', () => {
  const logs = [
    makeLog('2026-01-01'),
    makeLog('2026-01-02'),
    makeLog('2026-01-03'),
    makeLog('2026-01-04'),
    makeLog('2026-01-29'),
    makeLog('2026-01-30'),
    makeLog('2026-01-31'),
    makeLog('2026-02-01'),
  ];

  const starts = extractPeriodStarts(logs);
  expect(starts).toEqual(['2026-01-01', '2026-01-29']);
});

test('a single 1-day gap inside a period does not create a second start', () => {
  const logs = [
    makeLog('2026-01-01'),
    makeLog('2026-01-02'),
    // Gap on 2026-01-03 (not in logs)
    makeLog('2026-01-04'),
    makeLog('2026-01-05'),
  ];

  const starts = extractPeriodStarts(logs);
  expect(starts.length).toBe(1);
  expect(starts[0]).toBe('2026-01-01');
});

test('currentCycleDay returns null with no starts', () => {
  expect(currentCycleDay([], '2026-01-10')).toBeNull();
});

test('currentCycleDay returns daysSinceLastStart + 1', () => {
  expect(currentCycleDay(['2026-01-01'], '2026-01-05')).toBe(5);
});

test('predictNextPeriod with fewer than 2 cycles returns low confidence with no window', () => {
  const result = predictNextPeriod(['2026-01-01'], '2026-01-10');
  expect(result.confidence).toBe('low');
  expect('windowStart' in result).toBe(false);
  expect('windowEnd' in result).toBe(false);
  expect('mostLikely' in result).toBe(false);
});

test('predictNextPeriod with >= 2 regular cycles sets mostLikely and a window', () => {
  const starts = ['2026-01-01', '2026-01-29', '2026-02-26'];
  const result = predictNextPeriod(starts, '2026-02-27');
  expect(result.mostLikely).toBeDefined();
  expect(result.windowStart).toBeDefined();
  expect(result.windowEnd).toBeDefined();
});

test('cycle-length stddev over 5 days forces low confidence even with 6 cycles', () => {
  // Highly irregular cycle lengths: 20, 40, 22, 38, 21, 39 days
  // This gives a high stddev (well over 5)
  const starts = [
    '2026-01-01',
    '2026-01-21',
    '2026-03-02',
    '2026-03-24',
    '2026-05-01',
    '2026-05-22',
    '2026-07-01',
  ];
  const result = predictNextPeriod(starts, '2026-07-05');
  expect(result.confidence).toBe('low');
});

test('day math is timezone-safe regardless of process TZ', () => {
  const originalTZ = process.env.TZ;
  try {
    process.env.TZ = 'Pacific/Kiritimati';
    const result1 = currentCycleDay(['2026-01-01'], '2026-01-10');
    expect(result1).toBe(10);

    process.env.TZ = 'UTC';
    const result2 = currentCycleDay(['2026-01-01'], '2026-01-10');
    expect(result2).toBe(10);
  } finally {
    process.env.TZ = originalTZ;
  }
});

test("cyclePhase maps day 1-5 to 'period' and the ovulation window to 'fertile'", () => {
  const avgLength = 28;
  expect(cyclePhase(1, avgLength)).toBe('period');
  expect(cyclePhase(5, avgLength)).toBe('period');
  expect(cyclePhase(14, avgLength)).toBe('fertile');
});
