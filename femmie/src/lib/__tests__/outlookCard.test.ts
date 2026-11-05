import {
  buildOutlookCard,
  OUTLOOK_CARD_TITLE,
  OUTLOOK_NO_HISTORY_BODY,
  OUTLOOK_NO_PATTERN_BODY,
} from '../outlookCard';
import type { TodayOutlook } from '../outlook';

const ready: TodayOutlook = {
  cycleDay: 14,
  phase: 'fertile',
  observations: [
    { signal: 'energy', pattern: 'Your energy tends to run low around now — in 4 of 5 past cycles.', cyclesObserved: 4 },
    { signal: 'pain', pattern: "You've often logged pain around now — in 3 of 5 past cycles.", cyclesObserved: 3 },
  ],
  suggestion: 'Your pattern shows lower energy around now — a lighter schedule might feel better.',
  dataBasis: 'Based on 5 past cycles',
};

test('muted → hidden, regardless of outlook', () => {
  expect(buildOutlookCard(ready, true)).toEqual({ kind: 'hidden' });
  expect(buildOutlookCard(null, true)).toEqual({ kind: 'hidden' });
});

test('no cycle history → placeholder with no footer', () => {
  expect(buildOutlookCard(null, false)).toEqual({
    kind: 'placeholder',
    title: OUTLOOK_CARD_TITLE,
    body: OUTLOOK_NO_HISTORY_BODY,
    footer: null,
  });
});

test('fewer than 3 cycles → neutral placeholder, keeps dataBasis, never fabricates a pattern', () => {
  const result = buildOutlookCard(
    { ...ready, observations: [], suggestion: null, dataBasis: 'Based on 2 past cycles' },
    false,
  );
  expect(result.kind).toBe('placeholder');
  if (result.kind !== 'placeholder') return;
  expect(result.body).toBe(OUTLOOK_NO_PATTERN_BODY);
  expect(result.footer).toBe('Based on 2 past cycles');
  const json = JSON.stringify(result);
  expect(json).not.toContain('Your pattern');
  expect(json).not.toContain('tends to');
});

test('ready → headline from cycleDay + phase label, observations in order, suggestion and footer passed through', () => {
  const result = buildOutlookCard(ready, false);
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') return;
  expect(result.headline).toBe('Day 14 · Fertile window');
  expect(result.observations.map((o) => o.key)).toEqual(['energy', 'pain']);
  expect(result.observations[0].text).toBe(ready.observations[0].pattern);
  expect(result.suggestion).toBe(ready.suggestion);
  expect(result.footer).toBe('Based on 5 past cycles');
});

test('every phase has a label', () => {
  for (const phase of ['period', 'follicular', 'fertile', 'luteal'] as const) {
    const result = buildOutlookCard({ ...ready, phase }, false);
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') continue;
    expect(result.headline).toMatch(/^Day 14 · \S/);
  }
});

test('does not mutate the outlook', () => {
  Object.freeze(ready.observations);
  Object.freeze(ready);
  expect(() => buildOutlookCard(ready, false)).not.toThrow();
  expect(ready.observations.length).toBe(2);
});
