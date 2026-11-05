import {
  REGION_LABEL,
  INTENSITY_STEPS,
  EFFECTIVENESS_STEPS,
  emptyDraft,
  toggleRegion,
  draftToEvent,
  canSaveDraft,
  sortEventsNewestFirst,
  type PainDraft,
} from '../painForm';
import { BODY_REGIONS, type PainEvent } from '../../types/pain';

const base = (): PainDraft => ({ ...emptyDraft('2026-03-04'), locations: ['head'], intensity: 6 });

describe('painForm', () => {
  it('REGION_LABEL has a non-empty English label for every BODY_REGIONS entry', () => {
    for (const region of BODY_REGIONS) {
      expect(REGION_LABEL[region].length).toBeGreaterThan(0);
    }
    expect(Object.keys(REGION_LABEL).sort()).toEqual([...BODY_REGIONS].sort());
  });

  it('toggleRegion adds a region, then removes it, keeping the others in order', () => {
    expect(toggleRegion(['head'], 'pelvis')).toEqual(['head', 'pelvis']);
    expect(toggleRegion(['head', 'pelvis'], 'head')).toEqual(['pelvis']);
  });

  it('draftToEvent refuses an empty location list and a missing intensity', () => {
    expect(draftToEvent({ ...base(), locations: [] })).toBeNull();
    expect(draftToEvent({ ...base(), intensity: null })).toBeNull();
  });

  it('draftToEvent omits medication when the name is blank and trims it when present', () => {
    expect(draftToEvent({ ...base(), medicationName: '   ' })?.medications).toEqual([]);
    expect(
      draftToEvent({ ...base(), medicationName: '  Ibuprofen ', medicationEffectiveness: 4 })
        ?.medications,
    ).toEqual([{ name: 'Ibuprofen', effectiveness: 4 }]);
  });

  it('draftToEvent treats a half-filled medication as incomplete', () => {
    const nameOnly = { ...base(), medicationName: 'Ibuprofen', medicationEffectiveness: null };
    const effOnly = { ...base(), medicationName: '', medicationEffectiveness: 3 };
    expect(draftToEvent(nameOnly)).toBeNull();
    expect(draftToEvent(effOnly)).toBeNull();
    expect(canSaveDraft(nameOnly)).toBe(false);
    expect(canSaveDraft(effOnly)).toBe(false);
  });

  it('draftToEvent rejects out-of-range values via isValidPainEvent', () => {
    expect(draftToEvent({ ...base(), intensity: 11 })).toBeNull();
    expect(
      draftToEvent({ ...base(), medicationName: 'x', medicationEffectiveness: 6 }),
    ).toBeNull();
    expect(draftToEvent({ ...base(), date: '04/03/2026' })).toBeNull();
  });

  it('sortEventsNewestFirst orders by date descending without mutating the input', () => {
    const mk = (id: string, date: string): PainEvent => ({
      id,
      date,
      locations: ['head'],
      intensity: 5,
      durationMin: 60,
      medications: [],
    });
    const input = [
      mk('a', '2026-01-01'),
      mk('b', '2026-02-01'),
      mk('c', '2026-01-15'),
    ];
    const sorted = sortEventsNewestFirst(input);
    expect(sorted.map((e) => e.date)).toEqual(['2026-02-01', '2026-01-15', '2026-01-01']);
    expect(input.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('INTENSITY_STEPS and EFFECTIVENESS_STEPS span the type constants', () => {
    expect(INTENSITY_STEPS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(EFFECTIVENESS_STEPS).toEqual([1, 2, 3, 4, 5]);
  });
});
