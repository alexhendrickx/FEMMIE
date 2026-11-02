import {
  normalizeTagName,
  isValidTagName,
  findDuplicate,
  mergeTags,
  remapTagInLogs,
  buildTagLabels,
  suggestTagsFromNotes,
  MAX_TAG_NAME_LENGTH,
} from '../customTags';
import { computeCorrelations } from '../correlation';
import type { CustomTag } from '../../types/customTags';
import type { DailyLog, LogEntry } from '../../types/logging';

function tag(id: string, name: string): CustomTag {
  return { id, name, color: 'accent', icon: '✨', scaleType: 'binary', createdAt: '2026-01-01T00:00:00Z' };
}

function makeLog(date: string, entries: LogEntry[]): DailyLog {
  return { date, cycleDay: 1, entries, savedAt: `${date}T00:00:00.000Z` };
}

describe('normalizeTagName / isValidTagName', () => {
  test('normalizes case and whitespace', () => {
    expect(normalizeTagName('  Brain   Fog ')).toBe('brain fog');
  });
  test('rejects empty and over-long names', () => {
    expect(isValidTagName('   ')).toBe(false);
    expect(isValidTagName('ok')).toBe(true);
    expect(isValidTagName('x'.repeat(MAX_TAG_NAME_LENGTH + 1))).toBe(false);
  });
});

describe('findDuplicate', () => {
  const tags = [tag('t1', 'Low energy'), tag('t2', 'Brain fog')];

  test('matches case/whitespace-insensitively', () => {
    expect(findDuplicate(tags, 'low  ENERGY')?.id).toBe('t1');
  });
  test('matches a subset/superset of words (energy ⊂ low energy)', () => {
    expect(findDuplicate(tags, 'energy')?.id).toBe('t1');
    expect(findDuplicate(tags, 'terrible brain fog')?.id).toBe('t2');
  });
  test('returns null when nothing is similar', () => {
    expect(findDuplicate(tags, 'nausea')).toBeNull();
    expect(findDuplicate(tags, '   ')).toBeNull();
  });
});

describe('mergeTags + remapTagInLogs', () => {
  test('merge drops the discarded tag, keeping the other', () => {
    const tags = [tag('keep', 'Low energy'), tag('drop', 'Energy')];
    const merged = mergeTags(tags, 'keep', 'drop');
    expect(merged.map((t) => t.id)).toEqual(['keep']);
  });

  test('merge is a no-op when keep === discard', () => {
    const tags = [tag('a', 'A')];
    expect(mergeTags(tags, 'a', 'a')).toEqual(tags);
  });

  test('remapTagInLogs re-points history without mutating inputs', () => {
    const logs = [
      makeLog('2026-01-10', [{ categoryId: 'drop', value: true }]),
      makeLog('2026-01-11', [{ categoryId: 'cramps', value: 3 }]),
    ];
    const out = remapTagInLogs(logs, 'drop', 'keep');
    expect(out[0].entries[0].categoryId).toBe('keep');
    expect(out[1]).toBe(logs[1]); // untouched log returned by reference
    expect(logs[0].entries[0].categoryId).toBe('drop'); // original not mutated
  });
});

describe('buildTagLabels + correlation integration', () => {
  test('custom tags flow into the correlation engine via labels', () => {
    const tags = [tag('tag_brainfog', 'Brain fog')];
    const labels = buildTagLabels(tags);
    expect(labels).toEqual({ tag_brainfog: 'Brain fog' });

    // 4 regular cycles, custom tag logged on luteal days of 3 cycles
    const START = '2026-01-01';
    const DAY = 86400000;
    const isoAt = (off: number) =>
      new Date(Date.parse(`${START}T00:00:00Z`) + off * DAY).toISOString().slice(0, 10);
    const logs: DailyLog[] = [];
    for (let c = 0; c < 4; c++) {
      for (let d = 0; d < 4; d++) logs.push(makeLog(isoAt(c * 28 + d), [{ categoryId: 'menstrual_flow', value: 'medium' }]));
    }
    for (const c of [0, 1, 2]) logs.push(makeLog(isoAt(c * 28 + 21), [{ categoryId: 'tag_brainfog', value: true }]));

    const result = computeCorrelations(logs, { labels });
    const bf = result.find((r) => r.symptomId === 'tag_brainfog')!;
    expect(bf).toBeDefined();
    expect(bf.symptomName).toBe('Brain fog');
    expect(bf.cyclesObserved).toBe(3);
  });
});

describe('suggestTagsFromNotes', () => {
  test('suggests a frequent phrase not already tagged, preferring the bigram', () => {
    const notes = Array(6).fill('ugh the brain fog is back again');
    const suggestions = suggestTagsFromNotes(notes, [], 5);
    const phrases = suggestions.map((s) => s.phrase);
    expect(phrases).toContain('brain fog');
    // "brain" and "fog" alone are covered by the bigram, so not suggested separately
    expect(phrases).not.toContain('brain');
    expect(phrases).not.toContain('fog');
    expect(suggestions[0].count).toBe(6);
  });

  test('ignores phrases below the threshold', () => {
    const notes = ['brain fog', 'brain fog']; // only twice
    expect(suggestTagsFromNotes(notes, [], 5)).toEqual([]);
  });

  test('excludes phrases that already exist as tags', () => {
    const notes = Array(8).fill('brain fog everywhere');
    const existing = [tag('t1', 'Brain Fog')];
    const phrases = suggestTagsFromNotes(notes, existing, 5).map((s) => s.phrase);
    expect(phrases).not.toContain('brain fog');
  });

  test('strips punctuation and stopwords', () => {
    const notes = Array(5).fill('cramps!!! really bad cramps, cramps...');
    const phrases = suggestTagsFromNotes(notes, [], 5).map((s) => s.phrase);
    expect(phrases).toContain('cramps');
    expect(phrases).not.toContain('really'); // stopword
  });
});
