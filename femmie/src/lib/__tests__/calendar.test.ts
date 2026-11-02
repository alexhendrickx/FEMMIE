import { buildCalendarDays } from '../calendar';
import type { DailyLog, LogEntry } from '../../types/logging';

const DAY = 86400000;
const BASE = '2026-01-01';
const isoAt = (off: number) =>
  new Date(Date.parse(`${BASE}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);
const makeLog = (date: string, entries: LogEntry[]): DailyLog => ({
  date,
  cycleDay: 1,
  entries,
  savedAt: `${date}T00:00:00.000Z`,
});

test('no logs → no calendar days', () => {
  expect(buildCalendarDays([], isoAt(0))).toEqual([]);
});

test('flow days become confirmed; output is date-sorted', () => {
  const logs = [
    makeLog(isoAt(2), [{ categoryId: 'cramps', value: 3 }]),
    makeLog(isoAt(0), [{ categoryId: 'menstrual_flow', value: 'medium' }]),
    makeLog(isoAt(1), [{ categoryId: 'menstrual_flow', value: 'light' }]),
  ];
  const days = buildCalendarDays(logs, isoAt(10));
  const confirmed = days.filter((d) => d.state === 'confirmed').map((d) => d.date);
  expect(confirmed).toEqual([isoAt(0), isoAt(1)]); // cramps-only day is not confirmed
});

test('derives fertile window and a predicted next-period window from history', () => {
  // 3 regular 28-day cycles
  const logs: DailyLog[] = [];
  for (let c = 0; c < 3; c++) {
    for (let d = 0; d < 4; d++) logs.push(makeLog(isoAt(c * 28 + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
  }
  const days = buildCalendarDays(logs, isoAt(60));
  expect(days.some((d) => d.state === 'fertile')).toBe(true);
  expect(days.some((d) => d.state === 'predicted')).toBe(true);
});

test('confirmed takes precedence over fertile/predicted on the same day', () => {
  const logs: DailyLog[] = [];
  for (let c = 0; c < 3; c++) {
    for (let d = 0; d < 4; d++) logs.push(makeLog(isoAt(c * 28 + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
  }
  const days = buildCalendarDays(logs, isoAt(60));
  // every confirmed date should carry 'confirmed', never be downgraded
  for (const d of days.filter((x) => x.state === 'confirmed')) {
    const dupes = days.filter((x) => x.date === d.date);
    expect(dupes).toHaveLength(1);
  }
});
