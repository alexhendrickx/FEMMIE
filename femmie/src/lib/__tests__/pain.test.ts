import {
  isValidPainEvent,
  topLocations,
  avgIntensityByPhase,
  medicationStats,
  painSummary,
} from '../pain';
import type { PainEvent } from '../../types/pain';

const DAY = 86400000;
const BASE = '2026-01-01';
const isoAt = (off: number) =>
  new Date(Date.parse(`${BASE}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);

const starts = [0, 28, 56].map(isoAt); // 28-day cycles

function event(partial: Partial<PainEvent> & { date: string }): PainEvent {
  return {
    id: partial.id ?? partial.date,
    date: partial.date,
    locations: partial.locations ?? ['head'],
    intensity: partial.intensity ?? 5,
    durationMin: partial.durationMin ?? 60,
    medications: partial.medications ?? [],
  };
}

describe('isValidPainEvent', () => {
  test('accepts a well-formed event', () => {
    expect(isValidPainEvent(event({ date: isoAt(1), intensity: 7, locations: ['head', 'neck'] }))).toBe(true);
  });
  test('rejects out-of-range intensity, bad region, bad med effectiveness', () => {
    expect(isValidPainEvent(event({ date: isoAt(1), intensity: 11 }))).toBe(false);
    expect(isValidPainEvent(event({ date: isoAt(1), locations: ['elbow' as never] }))).toBe(false);
    expect(
      isValidPainEvent(event({ date: isoAt(1), medications: [{ name: 'ibuprofen', effectiveness: 9 }] })),
    ).toBe(false);
    expect(
      isValidPainEvent(event({ date: isoAt(1), medications: [{ name: '  ', effectiveness: 3 }] })),
    ).toBe(false);
  });
});

describe('topLocations', () => {
  test('counts and ranks reported regions', () => {
    const events = [
      event({ date: isoAt(1), locations: ['head', 'lower_back'] }),
      event({ date: isoAt(2), locations: ['head'] }),
      event({ date: isoAt(3), locations: ['lower_back', 'pelvis'] }),
    ];
    const top = topLocations(events, 2);
    expect(top[0]).toEqual({ region: 'head', count: 2 });
    expect(top.map((l) => l.region)).toEqual(['head', 'lower_back']);
  });
});

describe('avgIntensityByPhase', () => {
  test('averages intensity within each cycle phase', () => {
    const events = [
      event({ date: isoAt(1), intensity: 8 }), // cycle day 2 → period
      event({ date: isoAt(2), intensity: 6 }), // cycle day 3 → period
      event({ date: isoAt(21), intensity: 4 }), // cycle day 22 → luteal
    ];
    const byPhase = avgIntensityByPhase(events, starts);
    expect(byPhase.period).toEqual({ avgIntensity: 7, count: 2 });
    expect(byPhase.luteal).toEqual({ avgIntensity: 4, count: 1 });
    expect(byPhase.fertile).toEqual({ avgIntensity: 0, count: 0 });
  });
});

describe('medicationStats', () => {
  test('aggregates by medication name (case-insensitive), ranks by effectiveness', () => {
    const events = [
      event({ date: isoAt(1), medications: [{ name: 'Ibuprofen', effectiveness: 4 }] }),
      event({ date: isoAt(2), medications: [{ name: 'ibuprofen', effectiveness: 2 }] }),
      event({ date: isoAt(3), medications: [{ name: 'Paracetamol', effectiveness: 5 }] }),
    ];
    const stats = medicationStats(events);
    expect(stats[0]).toEqual({ name: 'Paracetamol', timesTried: 1, avgEffectiveness: 5 });
    const ibu = stats.find((s) => s.name.toLowerCase() === 'ibuprofen')!;
    expect(ibu).toEqual({ name: 'Ibuprofen', timesTried: 2, avgEffectiveness: 3 });
  });
});

describe('painSummary', () => {
  test('drops invalid events and summarizes the rest with a date range', () => {
    const events = [
      event({ date: isoAt(1), intensity: 8, locations: ['head'] }),
      event({ date: isoAt(21), intensity: 4, locations: ['lower_back'] }),
      event({ date: isoAt(5), intensity: 99 }), // invalid → dropped
    ];
    const summary = painSummary(events, starts);
    expect(summary.totalEvents).toBe(2);
    expect(summary.avgIntensity).toBe(6);
    expect(summary.dateRange).toEqual({ from: isoAt(1), to: isoAt(21) });
    expect(summary.topLocations.map((l) => l.region)).toEqual(['head', 'lower_back']);
  });

  test('empty input yields a null date range and zeroed stats (never throws)', () => {
    const summary = painSummary([], starts);
    expect(summary.totalEvents).toBe(0);
    expect(summary.avgIntensity).toBe(0);
    expect(summary.dateRange).toBeNull();
  });
});
