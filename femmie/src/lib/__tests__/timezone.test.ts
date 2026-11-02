import {
  localDayISO,
  isSameLocalDay,
  localWallClockToUtc,
  localDaysBetween,
} from '../timezone';

describe('localDayISO', () => {
  test('maps the same instant to different local calendar days by zone', () => {
    // 2026-01-01T02:00:00Z
    const instant = Date.parse('2026-01-01T02:00:00Z');
    expect(localDayISO(instant, 'UTC')).toBe('2026-01-01');
    expect(localDayISO(instant, 'America/New_York')).toBe('2025-12-31'); // UTC-5 → still prev day
    expect(localDayISO(instant, 'Pacific/Kiritimati')).toBe('2026-01-01'); // UTC+14 → 16:00
  });

  test('travel scenario: one UTC moment is two different local days', () => {
    const instant = Date.parse('2026-03-15T23:30:00Z');
    expect(localDayISO(instant, 'Asia/Tokyo')).toBe('2026-03-16'); // +9 → 08:30 next day
    expect(localDayISO(instant, 'America/Los_Angeles')).toBe('2026-03-15'); // -7 → 16:30 same day
  });
});

describe('isSameLocalDay', () => {
  test('true when two instants share the local day in a zone', () => {
    const a = Date.parse('2026-05-10T04:00:00Z'); // NY: 2026-05-10 00:00
    const b = Date.parse('2026-05-11T03:00:00Z'); // NY: 2026-05-10 23:00
    expect(isSameLocalDay(a, b, 'America/New_York')).toBe(true);
    expect(isSameLocalDay(a, b, 'UTC')).toBe(false);
  });
});

describe('localWallClockToUtc', () => {
  test('keeps a 21:00 reminder at 21:00 local across DST (Brussels)', () => {
    // Summer (CEST, UTC+2): 21:00 local → 19:00Z
    const summer = localWallClockToUtc('2026-06-01', 21, 0, 'Europe/Brussels');
    expect(summer.getUTCHours()).toBe(19);
    expect(localDayISO(summer, 'Europe/Brussels')).toBe('2026-06-01');

    // Winter (CET, UTC+1): 21:00 local → 20:00Z
    const winter = localWallClockToUtc('2026-01-01', 21, 0, 'Europe/Brussels');
    expect(winter.getUTCHours()).toBe(20);
  });

  test('resolves a wall time in a far-east zone', () => {
    // Tokyo is UTC+9 year-round: 09:00 local → 00:00Z same day
    const t = localWallClockToUtc('2026-07-01', 9, 0, 'Asia/Tokyo');
    expect(t.getUTCHours()).toBe(0);
    expect(localDayISO(t, 'Asia/Tokyo')).toBe('2026-07-01');
  });
});

describe('localDaysBetween', () => {
  test('counts whole local days and can be negative', () => {
    const d1 = Date.parse('2026-02-01T12:00:00Z');
    const d10 = Date.parse('2026-02-10T12:00:00Z');
    expect(localDaysBetween(d1, d10, 'UTC')).toBe(9);
    expect(localDaysBetween(d10, d1, 'UTC')).toBe(-9);
  });

  test('a redeye crossing local midnight counts as a day even with a short UTC gap', () => {
    // 23:30 then 00:30 local in NY = 1 local day apart, only 1h of real time
    const late = Date.parse('2026-04-10T03:30:00Z'); // NY 2026-04-09 23:30 (EDT -4)
    const early = Date.parse('2026-04-10T04:30:00Z'); // NY 2026-04-10 00:30
    expect(localDaysBetween(late, early, 'America/New_York')).toBe(1);
  });
});
