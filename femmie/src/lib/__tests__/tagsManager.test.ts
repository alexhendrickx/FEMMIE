import {
  buildTagRows,
  checkTagName,
  collectNotes,
  newTagId,
  remapTagInLogsDeduped,
  removeTagFromLogs,
  resolveTagColor,
  suggestionToName,
  suggestionsFor,
} from '../tagsManager';
import { colors } from '../../theme/colors';
import type { CustomTag } from '../../types/customTags';
import type { DailyLog, EntryValue } from '../../types/logging';

// Free-text notes are not yet a member of EntryValue (no surface logs them); cast at the fixture edge only.
const asNote = (text: string) => text as unknown as EntryValue;

const tag = (
  id: string,
  name: string,
  scaleType: CustomTag['scaleType'] = 'binary',
): CustomTag => ({
  id,
  name,
  color: 'textSecondary',
  icon: '🏷️',
  scaleType,
  createdAt: '2026-01-01T00:00:00.000Z',
});

const log = (date: string, entries: DailyLog['entries']): DailyLog => ({
  date,
  cycleDay: 1,
  entries,
  savedAt: '2026-01-01T00:00:00.000Z',
});

const noteLog = (date: string, tagId: string, text: string): DailyLog =>
  log(date, [{ categoryId: tagId, value: asNote(text) }]);

describe('checkTagName', () => {
  it('rejects empty with "Give your tag a name."', () => {
    expect(checkTagName([], '   ')).toEqual({ ok: false, error: 'Give your tag a name.' });
  });

  it('rejects names over 40 characters', () => {
    const result = checkTagName([], 'a'.repeat(41));
    expect(result).toEqual({ ok: false, error: 'Keep it under 40 characters.' });
  });

  it('rejects an exact duplicate case/space-insensitively and returns duplicateOf', () => {
    const tags = [tag('t1', 'Brain fog')];
    const result = checkTagName(tags, '  brain   FOG ');
    expect(result).toEqual({
      ok: false,
      error: 'You already have a tag called “Brain fog”.',
      duplicateOf: tags[0],
    });
  });

  it('rejects a subset match ("energy" vs "Low energy") with the "looks a lot like" message', () => {
    const tags = [tag('t1', 'Low energy')];
    const result = checkTagName(tags, 'energy');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('This looks a lot like “Low energy”. Use that one, or merge them.');
    }
  });

  it('ignores the tag being renamed (ignoreId)', () => {
    expect(checkTagName([tag('t1', 'Cramps')], 'cramps', 't1')).toEqual({ ok: true, name: 'cramps' });
  });

  it('returns the cleaned name (case kept, whitespace collapsed)', () => {
    expect(checkTagName([], '  Night   sweats ')).toEqual({ ok: true, name: 'Night sweats' });
  });
});

describe('remapTagInLogsDeduped', () => {
  it('re-points entries and keeps the kept tag value when both are on the same day', () => {
    const logs = [
      log('2026-01-01', [
        { categoryId: 'a', value: 3 },
        { categoryId: 'b', value: 5 },
      ]),
      log('2026-01-02', [{ categoryId: 'a', value: 2 }]),
    ];
    const result = remapTagInLogsDeduped(logs, 'a', 'b');
    expect(result[0].entries).toEqual([{ categoryId: 'b', value: 5 }]);
    expect(result[1].entries).toEqual([{ categoryId: 'b', value: 2 }]);
  });

  it('does not mutate its input', () => {
    const logs = [log('2026-01-01', [{ categoryId: 'a', value: 3 }])];
    const snapshot = JSON.stringify(logs);
    remapTagInLogsDeduped(logs, 'a', 'b');
    expect(JSON.stringify(logs)).toBe(snapshot);
  });
});

describe('removeTagFromLogs', () => {
  it('strips only that tag and keeps untouched log identity', () => {
    const touched = log('2026-01-01', [
      { categoryId: 'x', value: 1 },
      { categoryId: 'y', value: 2 },
    ]);
    const untouched = log('2026-01-02', [{ categoryId: 'y', value: 4 }]);
    const [first, second] = removeTagFromLogs([touched, untouched], 'x');
    expect(first.entries).toEqual([{ categoryId: 'y', value: 2 }]);
    expect(second).toBe(untouched);
  });
});

describe('collectNotes', () => {
  it('only returns string values of free_text tags', () => {
    const tags = [tag('f', 'Journal', 'free_text'), tag('b', 'Cramps', 'binary')];
    const logs = [
      log('2026-01-01', [
        { categoryId: 'f', value: asNote('brain fog') },
        { categoryId: 'f', value: 3 },
        { categoryId: 'b', value: true },
      ]),
    ];
    expect(collectNotes(logs, tags)).toEqual(['brain fog']);
  });
});

describe('suggestionsFor', () => {
  const journal = tag('f', 'Journal', 'free_text');
  const fogLogs = [1, 2, 3, 4, 5].map((d) => noteLog(`2026-01-0${d}`, 'f', 'Brain fog'));
  const crampLogs = [6, 7, 8, 9, 10].map((d) => noteLog(`2026-01-${d}`, 'f', 'Cramps'));
  it('surfaces a phrase written >=5 times and excludes existing tags', () => {
    const logs = [...fogLogs, ...crampLogs];
    expect(suggestionsFor(logs, [journal])).toEqual([
      { phrase: 'brain fog', count: 5 },
      { phrase: 'cramps', count: 5 },
    ]);
    expect(suggestionsFor(logs, [journal, tag('c', 'Cramps')])).toEqual([
      { phrase: 'brain fog', count: 5 },
    ]);
  });

  it('caps the result by limit', () => {
    const logs = [...fogLogs, ...crampLogs];
    expect(suggestionsFor(logs, [journal], undefined, 1)).toEqual([{ phrase: 'brain fog', count: 5 }]);
  });
});

describe('suggestionToName', () => {
  it('capitalises the first letter only', () => {
    expect(suggestionToName('brain fog')).toBe('Brain fog');
  });
});

describe('buildTagRows', () => {
  it('counts usage per day and sorts by name', () => {
    const tags = [tag('b', 'Bloating'), tag('a', 'Acne')];
    const logs = [
      log('2026-01-01', [
        { categoryId: 'a', value: 1 },
        { categoryId: 'b', value: true },
      ]),
      log('2026-01-02', [{ categoryId: 'a', value: 2 }]),
    ];
    const rows = buildTagRows(tags, logs);
    expect(rows.map((r) => [r.name, r.usageCount])).toEqual([
      ['Acne', 2],
      ['Bloating', 1],
    ]);
    expect(rows[0].scaleLabel).toBe('Yes / no');
    expect(rows[0].color).toBe(colors.textSecondary);
  });
});

describe('resolveTagColor', () => {
  it('falls back to colors.textSecondary for an unknown id', () => {
    expect(resolveTagColor('not-a-token')).toBe(colors.textSecondary);
    expect(resolveTagColor('fertile')).toBe(colors.fertile);
  });
});

describe('newTagId', () => {
  it('starts with tag_ and is deterministic for the given inputs', () => {
    const id = newTagId(1000, 0.5);
    expect(id.startsWith('tag_')).toBe(true);
    expect(newTagId(1000, 0.5)).toBe(id);
    expect(newTagId(1000, 0.25)).not.toBe(id);
  });
});
