import {
  buildExport,
  serializeExport,
  parseImport,
  validateExport,
} from '../portability';
import { EXPORT_SCHEMA_VERSION } from '../../types/portability';
import type { DailyLog } from '../../types/logging';
import type { CustomTag } from '../../types/customTags';

const log: DailyLog = {
  date: '2026-01-01',
  cycleDay: 1,
  entries: [{ categoryId: 'menstrual_flow', value: 'medium' }],
  savedAt: '2026-01-01T00:00:00.000Z',
};

const tag: CustomTag = {
  id: 'tag_brainfog',
  name: 'Brain fog',
  color: 'accent',
  icon: '🌫️',
  scaleType: 'binary',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('buildExport', () => {
  test('stamps schema version + timestamp and defaults optional sections', () => {
    const exp = buildExport({ logs: [log] }, new Date('2026-05-01T10:00:00Z'));
    expect(exp.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(exp.exportedAt).toBe('2026-05-01T10:00:00.000Z');
    expect(exp.customTags).toEqual([]);
    expect(exp.drspEntries).toEqual([]);
    expect(exp.painEvents).toEqual([]);
    expect(exp.settings).toEqual({});
  });
});

describe('round-trip', () => {
  test('serialize → parse reproduces the payload, custom tags included', () => {
    const exp = buildExport({ logs: [log], customTags: [tag], settings: { theme: 'dark' } });
    const result = parseImport(serializeExport(exp));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual(exp);
      expect(result.data.customTags[0].name).toBe('Brain fog'); // F2-13 survives export
    }
  });
});

describe('parseImport validation', () => {
  test('rejects non-JSON without throwing', () => {
    const r = parseImport('{not json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/JSON/);
  });

  test('rejects a newer schema version', () => {
    const r = parseImport(
      JSON.stringify({ schemaVersion: EXPORT_SCHEMA_VERSION + 1, exportedAt: new Date().toISOString(), logs: [] }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join(' ')).toMatch(/newer than this app/);
  });

  test('flags a malformed log date', () => {
    const errors = validateExport({
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00Z',
      logs: [{ date: '01/01/2026', entries: [] }],
    });
    expect(errors.some((e) => e.includes('logs[0]'))).toBe(true);
  });

  test('accepts a minimal valid payload and normalizes optional sections', () => {
    const r = parseImport(JSON.stringify({ schemaVersion: 1, exportedAt: '2026-01-01T00:00:00Z', logs: [] }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.customTags).toEqual([]);
      expect(r.data.painEvents).toEqual([]);
    }
  });

  test('rejects wrong-typed optional sections', () => {
    const errors = validateExport({
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00Z',
      logs: [],
      customTags: 'nope',
    });
    expect(errors.some((e) => e.includes('customTags'))).toBe(true);
  });
});
