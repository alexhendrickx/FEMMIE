import {
  MIN_QUICK_SYMPTOMS,
  MAX_QUICK_SYMPTOMS,
  DEFAULT_QUICK_SYMPTOM_IDS,
  PICKABLE_CATEGORIES,
  groupedPickableSymptoms,
  isValidSelection,
  toggleSymptom,
  sanitizeSelection,
} from '../quickSymptoms';

describe('pickable set', () => {
  test('excludes mood and flow categories and hours inputs', () => {
    const ids = PICKABLE_CATEGORIES.map((c) => c.id);
    expect(ids).not.toContain('mood');
    expect(ids).not.toContain('menstrual_flow');
    expect(ids).not.toContain('sleep_hours'); // inputType "hours"
    expect(PICKABLE_CATEGORIES.every((c) => c.group !== 'flow')).toBe(true);
    expect(PICKABLE_CATEGORIES.every((c) => c.inputType === 'boolean' || c.inputType === 'scale')).toBe(true);
  });

  test('the default set is valid and all pickable', () => {
    expect(isValidSelection(DEFAULT_QUICK_SYMPTOM_IDS)).toBe(true);
    const pickable = new Set(PICKABLE_CATEGORIES.map((c) => c.id));
    expect(DEFAULT_QUICK_SYMPTOM_IDS.every((id) => pickable.has(id))).toBe(true);
  });
});

describe('groupedPickableSymptoms', () => {
  test('returns only non-empty groups, every item has an explanation', () => {
    const groups = groupedPickableSymptoms();
    expect(groups.length).toBeGreaterThan(0);
    for (const g of groups) {
      expect(g.items.length).toBeGreaterThan(0);
      for (const item of g.items) {
        expect(typeof item.explain).toBe('string');
        expect(item.explain!.length).toBeGreaterThan(0);
      }
    }
  });

  test('every pickable symptom appears in exactly one group', () => {
    const flat = groupedPickableSymptoms().flatMap((g) => g.items.map((i) => i.id));
    expect(new Set(flat).size).toBe(flat.length);
    expect(flat.sort()).toEqual(PICKABLE_CATEGORIES.map((c) => c.id).sort());
  });
});

describe('isValidSelection', () => {
  test(`needs ${MIN_QUICK_SYMPTOMS}–${MAX_QUICK_SYMPTOMS}`, () => {
    expect(isValidSelection(['a', 'b', 'c', 'd'])).toBe(false); // 4 < min
    expect(isValidSelection(['a', 'b', 'c', 'd', 'e'])).toBe(true); // 5
    expect(isValidSelection(Array.from({ length: MAX_QUICK_SYMPTOMS }, (_, i) => `s${i}`))).toBe(true);
    expect(isValidSelection(Array.from({ length: MAX_QUICK_SYMPTOMS + 1 }, (_, i) => `s${i}`))).toBe(false);
  });
});

describe('toggleSymptom', () => {
  test('adds an unselected, removes a selected', () => {
    expect(toggleSymptom(['cramps'], 'headache')).toEqual(['cramps', 'headache']);
    expect(toggleSymptom(['cramps', 'headache'], 'cramps')).toEqual(['headache']);
  });

  test('refuses to add past the maximum', () => {
    const full = ['cramps', 'headache', 'bloating', 'fatigue', 'back_pain', 'nausea', 'acne', 'breast_tenderness'];
    expect(full.length).toBe(MAX_QUICK_SYMPTOMS);
    expect(toggleSymptom(full, 'anxiety')).toEqual(full); // unchanged
  });

  test('always allows removing, even below the minimum', () => {
    const five = ['cramps', 'headache', 'bloating', 'fatigue', 'back_pain'];
    expect(toggleSymptom(five, 'back_pain')).toHaveLength(4);
  });

  test('ignores unknown / non-pickable ids', () => {
    expect(toggleSymptom(['cramps'], 'not_a_symptom')).toEqual(['cramps']);
    expect(toggleSymptom(['cramps'], 'mood')).toEqual(['cramps']);
  });
});

describe('sanitizeSelection', () => {
  test('drops unknown ids, de-dups, and caps at the maximum', () => {
    expect(sanitizeSelection(['cramps', 'cramps', 'bogus', 'headache'])).toEqual(['cramps', 'headache']);
    const tooMany = Array.from({ length: 20 }, (_, i) => PICKABLE_CATEGORIES[i % PICKABLE_CATEGORIES.length].id);
    expect(sanitizeSelection(tooMany).length).toBe(MAX_QUICK_SYMPTOMS);
  });
});
