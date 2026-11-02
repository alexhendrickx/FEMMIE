import {
  isValidDrspEntry,
  drspDailyMean,
  severityByCycle,
  evaluateMoodSafeguard,
  SEVERE_SEVERITY_THRESHOLD,
  MIN_SEVERE_CYCLES,
} from '../mood';
import { DRSP_ITEM_COUNT } from '../../types/mood';
import type { DrspEntry } from '../../types/mood';

const DAY = 86400000;
const BASE = '2026-01-01';
const isoAt = (off: number) =>
  new Date(Date.parse(`${BASE}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);

/** 10-item DRSP entry, every item the same severity for easy means. */
function entry(dateOff: number, severity: number): DrspEntry {
  return { date: isoAt(dateOff), scores: Array(DRSP_ITEM_COUNT).fill(severity) };
}

// 28-day cycle starts at offsets 0, 28, 56, 84, 112 …
const starts = [0, 28, 56, 84, 112].map(isoAt);

describe('DRSP validation + scoring', () => {
  test('rejects wrong length or out-of-range scores', () => {
    expect(isValidDrspEntry({ date: isoAt(0), scores: Array(9).fill(3) })).toBe(false);
    expect(isValidDrspEntry({ date: isoAt(0), scores: Array(10).fill(7) })).toBe(false);
    expect(isValidDrspEntry({ date: isoAt(0), scores: Array(10).fill(0) })).toBe(false);
    expect(isValidDrspEntry(entry(0, 3))).toBe(true);
  });

  test('daily mean is null for invalid entries, else the average', () => {
    expect(drspDailyMean({ date: isoAt(0), scores: [1, 2] })).toBeNull();
    const mixed: DrspEntry = { date: isoAt(0), scores: [1, 1, 1, 1, 1, 5, 5, 5, 5, 5] };
    expect(drspDailyMean(mixed)).toBe(3);
  });
});

describe('severityByCycle', () => {
  test('groups entries by cycle and averages daily means', () => {
    const entries = [
      entry(10, 5), // cycle 0 (start offset 0)
      entry(12, 3), // cycle 0 → mean 4
      entry(40, 2), // cycle 1 (start offset 28)
    ];
    const result = severityByCycle(entries, starts);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ cycleId: isoAt(0), meanSeverity: 4, entryCount: 2 });
    expect(result[1]).toMatchObject({ cycleId: isoAt(28), meanSeverity: 2, entryCount: 1 });
  });

  test('skips invalid entries and entries before the first cycle', () => {
    const entries = [
      { date: isoAt(-5), scores: Array(10).fill(6) }, // before first start → skipped
      { date: isoAt(10), scores: Array(3).fill(6) }, // invalid → skipped
      entry(11, 4), // valid, cycle 0
    ];
    const result = severityByCycle(entries, starts);
    expect(result).toHaveLength(1);
    expect(result[0].entryCount).toBe(1);
  });
});

describe('evaluateMoodSafeguard', () => {
  test('does not trigger below the cycle threshold', () => {
    const entries = [entry(10, 5), entry(38, 5)]; // 2 severe cycles only
    const sg = evaluateMoodSafeguard(entries, starts);
    expect(sg.severeCycles).toBe(2);
    expect(sg.triggered).toBe(false);
  });

  test('triggers once a severe pattern holds across >= MIN_SEVERE_CYCLES', () => {
    // severe (>=4) in cycles 0,1,2
    const entries = [entry(10, 5), entry(38, 4), entry(66, 6)];
    const sg = evaluateMoodSafeguard(entries, starts);
    expect(sg.severeCycles).toBe(MIN_SEVERE_CYCLES);
    expect(sg.triggered).toBe(true);
    expect(sg.basis).toMatch(/doctor/);
  });

  test('a dismissed safeguard never triggers again', () => {
    const entries = [entry(10, 5), entry(38, 5), entry(66, 5)];
    const sg = evaluateMoodSafeguard(entries, starts, /* dismissed */ true);
    expect(sg.severeCycles).toBe(3);
    expect(sg.triggered).toBe(false);
  });

  test('cycles just below the severe threshold do not count', () => {
    const entries = [entry(10, 3.9999), entry(38, 3), entry(66, 2)];
    const sg = evaluateMoodSafeguard(entries, starts);
    expect(sg.severeCycles).toBe(0);
    expect(sg.triggered).toBe(false);
    expect(SEVERE_SEVERITY_THRESHOLD).toBe(4);
  });
});
