import {
  buildFlowSteps,
  assembleEntries,
  insightOfTheDay,
  emptyAnswers,
  DEFAULT_QUICK_SYMPTOM_IDS,
} from '../dailyFlow';
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

describe('buildFlowSteps', () => {
  test('period day: flow first, then mood, symptoms, insight', () => {
    expect(buildFlowSteps({ isLikelyPeriod: true })).toEqual(['flow', 'mood', 'symptoms', 'insight']);
  });
  test('non-period day: no flow step, mood first', () => {
    expect(buildFlowSteps({ isLikelyPeriod: false })).toEqual(['mood', 'symptoms', 'insight']);
  });
});

describe('assembleEntries', () => {
  test('maps mood, flow and selected symptoms; ignores unselected / none', () => {
    const entries = assembleEntries({
      mood: 'low',
      flow: 'medium',
      symptoms: { cramps: true, headache: false, acne: true },
    });
    expect(entries).toContainEqual({ categoryId: 'mood', value: 'low' });
    expect(entries).toContainEqual({ categoryId: 'menstrual_flow', value: 'medium' });
    expect(entries).toContainEqual({ categoryId: 'cramps', value: 3 }); // scale → 3
    expect(entries).toContainEqual({ categoryId: 'acne', value: true }); // boolean → true
    expect(entries.some((e) => e.categoryId === 'headache')).toBe(false);
  });

  test('explicit "no flow" and empty answers add nothing', () => {
    expect(assembleEntries({ flow: 'none', symptoms: {} })).toEqual([]);
    expect(assembleEntries(emptyAnswers())).toEqual([]);
  });
});

describe('insightOfTheDay', () => {
  test('returns null when there is not enough history', () => {
    expect(insightOfTheDay([], isoAt(10))).toBeNull();
  });

  test('surfaces a pattern once enough cycles exist', () => {
    // 5 cycles with cramps clustered luteal → a surfaced correlation exists
    const logs: DailyLog[] = [];
    for (let c = 0; c < 6; c++) {
      for (let d = 0; d < 4; d++) logs.push(makeLog(isoAt(c * 28 + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
    }
    for (const c of [0, 1, 2, 3, 4]) logs.push(makeLog(isoAt(c * 28 + 21), [{ categoryId: 'cramps', value: 4 }]));
    const insight = insightOfTheDay(logs, isoAt(5 * 28 + 1));
    expect(typeof insight).toBe('string');
    expect((insight as string).toLowerCase()).toContain('cramps');
  });
});

test('the default quick-symptom set is all real categories', () => {
  // guards against a typo'd id silently producing an untappable symptom
  const { CATEGORY_MAP } = require('../../data/categories');
  for (const id of DEFAULT_QUICK_SYMPTOM_IDS) {
    expect(CATEGORY_MAP.has(id)).toBe(true);
  }
});
