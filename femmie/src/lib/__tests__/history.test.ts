import {
  currentWeekDates,
  buildWeekCells,
  loggedDaysDescending,
  formatEntryValue,
  summarizeDay,
  WEEK_LABELS,
} from '../history';
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

describe('currentWeekDates', () => {
  test('returns 7 Mon→Sun dates for the week containing a mid-week day', () => {
    // 2026-11-04 is a Wednesday
    const week = currentWeekDates('2026-11-04');
    expect(week).toEqual([
      '2026-11-02', // Mon
      '2026-11-03',
      '2026-11-04', // Wed (today)
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08', // Sun
    ]);
  });

  test('a Monday anchors itself as the first day', () => {
    expect(currentWeekDates('2026-11-02')[0]).toBe('2026-11-02');
  });

  test('a Sunday is the last day, not the start of a new week', () => {
    const week = currentWeekDates('2026-11-08');
    expect(week[0]).toBe('2026-11-02');
    expect(week[6]).toBe('2026-11-08');
  });

  test('handles a week that spans a month boundary', () => {
    // 2026-04-01 is a Wednesday → week starts in March
    expect(currentWeekDates('2026-04-01')[0]).toBe('2026-03-30');
  });
});

describe('buildWeekCells', () => {
  test('labels Mon→Sun, exposes day-of-month, marks today', () => {
    const cells = buildWeekCells('2026-11-04');
    expect(cells.map((c) => c.weekdayLabel)).toEqual([...WEEK_LABELS]);
    expect(cells.map((c) => c.dayOfMonth)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(cells.filter((c) => c.isToday).map((c) => c.date)).toEqual(['2026-11-04']);
  });
});

describe('loggedDaysDescending', () => {
  test('returns only days with entries, most recent first', () => {
    const logs: Record<string, DailyLog> = {
      [isoAt(0)]: makeLog(isoAt(0), [{ categoryId: 'cramps', value: 2 }]),
      [isoAt(5)]: makeLog(isoAt(5), [{ categoryId: 'mood', value: 'good' }]),
      [isoAt(2)]: makeLog(isoAt(2), []), // empty → dropped
    };
    expect(loggedDaysDescending(logs).map((l) => l.date)).toEqual([isoAt(5), isoAt(0)]);
  });

  test('no logs → empty list', () => {
    expect(loggedDaysDescending({})).toEqual([]);
  });
});

describe('formatEntryValue', () => {
  test('boolean present entries have no value label', () => {
    expect(formatEntryValue('headache', true)).toBeNull();
  });

  test('flow / mood string values are humanized', () => {
    expect(formatEntryValue('menstrual_flow', 'very_heavy')).toBe('very heavy');
    expect(formatEntryValue('mood', 'low')).toBe('low');
  });

  test('scale numbers render as n/5, hours as Nh', () => {
    expect(formatEntryValue('cramps', 3)).toBe('3/5'); // cramps is a scale
    expect(formatEntryValue('sleep_hours', 7)).toBe('7h'); // sleep_hours is hours
  });
});

describe('summarizeDay', () => {
  test('maps entries to icon + label (+ value) from CATEGORY_MAP', () => {
    const items = summarizeDay(
      makeLog(isoAt(0), [
        { categoryId: 'menstrual_flow', value: 'medium' },
        { categoryId: 'headache', value: true },
        { categoryId: 'cramps', value: 4 },
      ]),
    );
    expect(items).toEqual([
      { categoryId: 'menstrual_flow', icon: '🩸', label: 'Flow', valueLabel: 'medium' },
      { categoryId: 'headache', icon: '🤕', label: 'Headache', valueLabel: null },
      { categoryId: 'cramps', icon: '⚡', label: 'Cramps', valueLabel: '4/5' },
    ]);
  });

  test('an unknown category id falls back gracefully', () => {
    const [item] = summarizeDay(makeLog(isoAt(0), [{ categoryId: 'mystery', value: true }]));
    expect(item).toEqual({ categoryId: 'mystery', icon: '•', label: 'mystery', valueLabel: null });
  });
});
