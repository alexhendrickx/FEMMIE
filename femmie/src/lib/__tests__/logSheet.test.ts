import {
  filterCategories,
  groupCategories,
  GROUP_ORDER,
  GROUP_TITLES,
} from '../logSheet';
import type { Category } from '../../types/logging';

const cat = (
  id: string,
  label: string,
  group: Category['group'],
): Category => ({
  id,
  label,
  group,
  inputType: 'boolean',
  periodOnly: false,
  icon: '•',
});

const SAMPLE: Category[] = [
  cat('menstrual_flow', 'Flow', 'flow'),
  cat('spotting', 'Spotting', 'flow'),
  cat('cramps', 'Cramps', 'symptoms'),
  cat('headache', 'Headache', 'symptoms'),
  cat('mood', 'Mood', 'mood'),
  cat('sleep_hours', 'Sleep hours', 'lifestyle'),
  cat('bbt', 'Basal temp', 'fertility'),
];

describe('filterCategories', () => {
  test('an empty or whitespace query returns the list unchanged', () => {
    expect(filterCategories(SAMPLE, '')).toEqual(SAMPLE);
    expect(filterCategories(SAMPLE, '   ')).toEqual(SAMPLE);
  });

  test('matches labels case-insensitively as a substring', () => {
    expect(filterCategories(SAMPLE, 'head').map((c) => c.id)).toEqual(['headache']);
    expect(filterCategories(SAMPLE, 'SLEEP').map((c) => c.id)).toEqual(['sleep_hours']);
  });

  test('matches mid-word and across groups, preserving input order', () => {
    // "o" appears in Flow, Spotting, Mood, Sleep hours
    expect(filterCategories(SAMPLE, 'o').map((c) => c.id)).toEqual([
      'menstrual_flow',
      'spotting',
      'mood',
      'sleep_hours',
    ]);
  });

  test('a non-matching query yields an empty list', () => {
    expect(filterCategories(SAMPLE, 'zzz')).toEqual([]);
  });

  test('ignores surrounding whitespace in the query', () => {
    expect(filterCategories(SAMPLE, '  cramp  ').map((c) => c.id)).toEqual(['cramps']);
  });
});

describe('groupCategories', () => {
  test('splits into the fixed section order with human titles', () => {
    const sections = groupCategories(SAMPLE);
    expect(sections.map((s) => s.group)).toEqual(GROUP_ORDER);
    expect(sections.map((s) => s.title)).toEqual([
      GROUP_TITLES.flow,
      GROUP_TITLES.symptoms,
      GROUP_TITLES.mood,
      GROUP_TITLES.lifestyle,
      GROUP_TITLES.fertility,
    ]);
  });

  test('keeps each category in its own group, preserving within-group order', () => {
    const sections = groupCategories(SAMPLE);
    const flow = sections.find((s) => s.group === 'flow');
    expect(flow?.categories.map((c) => c.id)).toEqual(['menstrual_flow', 'spotting']);
  });

  test('drops sections that have no categories', () => {
    const symptomsOnly = SAMPLE.filter((c) => c.group === 'symptoms');
    const sections = groupCategories(symptomsOnly);
    expect(sections.map((s) => s.group)).toEqual(['symptoms']);
  });

  test('empty input yields no sections', () => {
    expect(groupCategories([])).toEqual([]);
  });

  test('composes with filterCategories to show matches across groups, still grouped', () => {
    // "o" matches in flow, mood and lifestyle but not symptoms
    const sections = groupCategories(filterCategories(SAMPLE, 'o'));
    expect(sections.map((s) => s.group)).toEqual(['flow', 'mood', 'lifestyle']);
    expect(sections.flatMap((s) => s.categories.map((c) => c.id))).toEqual([
      'menstrual_flow',
      'spotting',
      'mood',
      'sleep_hours',
    ]);
  });
});
