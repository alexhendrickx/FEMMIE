import {
  DRSP_ITEMS,
  DRSP_SCALE_LABEL,
  DRSP_SCALE_STEPS,
  canSaveDraft,
  draftToEntry,
  emptyDraft,
  formatSeverity,
  remainingItems,
  setDraftScore,
  sortEntriesNewestFirst,
  type DrspDraft,
} from '../moodForm';
import { DRSP_ITEM_COUNT, type DrspEntry } from '../../types/mood';

const full = (v: number): DrspDraft => ({ date: '2026-03-04', scores: Array(DRSP_ITEM_COUNT).fill(v) });

describe('moodForm', () => {
  it('DRSP_ITEMS has exactly DRSP_ITEM_COUNT items with unique ids and non-empty labels', () => {
    expect(DRSP_ITEMS).toHaveLength(DRSP_ITEM_COUNT);
    const ids = DRSP_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(DRSP_ITEM_COUNT);
    DRSP_ITEMS.forEach((i) => expect(i.label.length).toBeGreaterThan(0));
  });

  it('DRSP_SCALE_STEPS spans DRSP_MIN..DRSP_MAX and every step has a label', () => {
    expect(DRSP_SCALE_STEPS).toEqual([1, 2, 3, 4, 5, 6]);
    DRSP_SCALE_STEPS.forEach((n) => expect(DRSP_SCALE_LABEL[n].length).toBeGreaterThan(0));
  });

  it('emptyDraft starts fully unrated and prefills from a valid existing entry for the same date', () => {
    const unrated = Array(DRSP_ITEM_COUNT).fill(null);
    expect(emptyDraft('2026-03-04').scores).toEqual(unrated);

    const scores = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
    const same: DrspEntry = { date: '2026-03-04', scores };
    expect(emptyDraft('2026-03-04', same).scores).toEqual(scores);

    const other: DrspEntry = { date: '2026-03-03', scores };
    expect(emptyDraft('2026-03-04', other).scores).toEqual(unrated);

    const invalid = { date: '2026-03-04', scores: Array(9).fill(3) };
    expect(emptyDraft('2026-03-04', invalid).scores).toEqual(unrated);
  });

  it('setDraftScore returns a new draft and ignores out-of-range index or score', () => {
    const draft = emptyDraft('2026-03-04');
    const next = setDraftScore(draft, 0, 4);
    expect(next).not.toBe(draft);
    expect(next.scores[0]).toBe(4);
    expect(draft.scores[0]).toBeNull();

    expect(setDraftScore(draft, DRSP_ITEM_COUNT, 3)).toBe(draft);
    expect(setDraftScore(draft, 0, 7)).toBe(draft);
    expect(setDraftScore(draft, 0, 0)).toBe(draft);
  });

  it('remainingItems counts unrated items', () => {
    expect(remainingItems(emptyDraft('2026-03-04'))).toBe(DRSP_ITEM_COUNT);
    expect(remainingItems(setDraftScore(emptyDraft('2026-03-04'), 0, 2))).toBe(DRSP_ITEM_COUNT - 1);
    expect(remainingItems(full(2))).toBe(0);
  });

  it('draftToEntry is null until every item is rated, then yields a valid entry', () => {
    const partial: DrspDraft = { date: '2026-03-04', scores: [3, ...Array(DRSP_ITEM_COUNT - 1).fill(null)] };
    expect(draftToEntry(partial)).toBeNull();
    expect(canSaveDraft(partial)).toBe(false);

    expect(draftToEntry(full(3))).toEqual({ date: '2026-03-04', scores: Array(DRSP_ITEM_COUNT).fill(3) });
    expect(canSaveDraft(full(3))).toBe(true);
  });

  it('draftToEntry rejects a non-ISO date', () => {
    expect(draftToEntry({ ...full(3), date: '04/03/2026' })).toBeNull();
  });

  it('sortEntriesNewestFirst orders by date descending without mutating the input', () => {
    const s = Array(DRSP_ITEM_COUNT).fill(1);
    const input: DrspEntry[] = [
      { date: '2026-01-01', scores: s },
      { date: '2026-02-01', scores: s },
      { date: '2026-01-15', scores: s },
    ];
    expect(sortEntriesNewestFirst(input).map((e) => e.date)).toEqual(['2026-02-01', '2026-01-15', '2026-01-01']);
    expect(input.map((e) => e.date)).toEqual(['2026-01-01', '2026-02-01', '2026-01-15']);
  });

  it('formatSeverity rounds to one decimal', () => {
    expect(formatSeverity(3.25)).toBe('3.3');
    expect(formatSeverity(4)).toBe('4.0');
  });
});
