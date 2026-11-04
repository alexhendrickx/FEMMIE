import { buildAgenda } from '../agenda';
import type { DailyLog, LogEntry } from '../../types/logging';

const makeLog = (date: string, entries: LogEntry[]): DailyLog => ({
  date,
  cycleDay: 1,
  entries,
  savedAt: `${date}T00:00:00.000Z`,
});
const flow = (date: string) => makeLog(date, [{ categoryId: 'menstrual_flow', value: 'medium' }]);

// Two periods a cycle apart → starts [01-01, 01-29], avg 28 days.
// Completed cycle 01-01; open cycle 01-29 (its fertile window lands 02-09..02-13).
const PERIOD_LOGS: DailyLog[] = [
  flow('2026-01-01'),
  flow('2026-01-02'),
  flow('2026-01-03'),
  flow('2026-01-29'),
  flow('2026-01-30'),
  flow('2026-01-31'),
];

describe('buildAgenda', () => {
  test('no logs → a single section holding just today, uncoloured', () => {
    const sections = buildAgenda([], '2026-02-15');
    expect(sections).toHaveLength(1);
    expect(sections[0].monthLabel).toBe('February 2026');
    expect(sections[0].days).toHaveLength(1);
    const [today] = sections[0].days;
    expect(today).toMatchObject({
      date: '2026-02-15',
      state: null,
      isToday: true,
      isFuture: false,
      summary: [],
    });
  });

  test('flow days become confirmed, grouped by month in ascending order', () => {
    const sections = buildAgenda(PERIOD_LOGS, '2026-02-15');
    expect(sections.map((s) => s.monthKey)).toEqual(['2026-01', '2026-02']);

    const jan = sections[0];
    expect(jan.days.map((d) => d.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-29',
      '2026-01-30',
      '2026-01-31',
    ]);
    expect(jan.days.every((d) => d.state === 'confirmed')).toBe(true);
  });

  test('cycle-day caption counts from the cycle the day belongs to', () => {
    const sections = buildAgenda(PERIOD_LOGS, '2026-02-15');
    const byDate = new Map(
      sections.flatMap((s) => s.days).map((d) => [d.date, d]),
    );
    expect(byDate.get('2026-01-03')?.cycleDay).toBe(3); // 3rd day of cycle 01-01
    expect(byDate.get('2026-01-29')?.cycleDay).toBe(1); // opens a new cycle
  });

  test('open-cycle fertile window is coloured and lands in February', () => {
    const feb = buildAgenda(PERIOD_LOGS, '2026-02-15').find((s) => s.monthKey === '2026-02')!;
    const fertile = feb.days.filter((d) => d.state === 'fertile').map((d) => d.date);
    expect(fertile).toEqual(['2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13']);
  });

  test('a symptom-only day shows its entries with no cycle colour', () => {
    const logs = [...PERIOD_LOGS, makeLog('2026-01-20', [{ categoryId: 'cramps', value: 4 }])];
    const jan = buildAgenda(logs, '2026-02-15').find((s) => s.monthKey === '2026-01')!;
    const day = jan.days.find((d) => d.date === '2026-01-20')!;
    expect(day.state).toBeNull();
    expect(day.summary).toEqual([
      { categoryId: 'cramps', icon: '⚡', label: 'Cramps', valueLabel: '4/5' },
    ]);
    // stays in ascending position between the two periods
    const idx = jan.days.findIndex((d) => d.date === '2026-01-20');
    expect(jan.days[idx - 1].date).toBe('2026-01-03');
    expect(jan.days[idx + 1].date).toBe('2026-01-29');
  });

  test('unsorted input still yields ascending output and includes today', () => {
    const shuffled = [PERIOD_LOGS[4], PERIOD_LOGS[0], PERIOD_LOGS[2]];
    const sections = buildAgenda(shuffled, '2026-02-15');
    const all = sections.flatMap((s) => s.days.map((d) => d.date));
    expect(all).toEqual([...all].sort((a, b) => a.localeCompare(b)));
    expect(all).toContain('2026-02-15');
    expect(sections.flatMap((s) => s.days).find((d) => d.isToday)?.date).toBe('2026-02-15');
  });

  test('future days (beyond today) are flagged isFuture', () => {
    // today before the fertile window → those fertile days are upcoming
    const feb = buildAgenda(PERIOD_LOGS, '2026-02-01').find((s) => s.monthKey === '2026-02')!;
    const fertile = feb.days.filter((d) => d.state === 'fertile');
    expect(fertile.length).toBeGreaterThan(0);
    expect(fertile.every((d) => d.isFuture)).toBe(true);
  });
});
