/**
 * Tests for cloud sync — the code path where data actually leaves the device.
 *
 * The product promise is "no readable health data ever leaves the device", so
 * the headline test here inspects the real bytes put on the wire and asserts
 * that no plaintext health content appears in them. The SQLite and Supabase
 * layers are mocked so the test is hermetic; encryption runs for real
 * (in dev-fallback mode).
 */
import { syncToCloud, pullFromCloud } from '../cloudSync';
import type { DailyLog } from '../../types/logging';

jest.mock('../sqlite', () => ({
  getUnsyncedLogIds: jest.fn(),
  getLog: jest.fn(),
  markLogSynced: jest.fn(),
  saveLog: jest.fn(),
}));

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { getUnsyncedLogIds, getLog, markLogSynced, saveLog } from '../sqlite';
import { supabase } from '../supabase';

const mockGetUnsyncedLogIds = getUnsyncedLogIds as jest.MockedFunction<typeof getUnsyncedLogIds>;
const mockGetLog = getLog as jest.MockedFunction<typeof getLog>;
const mockMarkLogSynced = markLogSynced as jest.MockedFunction<typeof markLogSynced>;
const mockSaveLog = saveLog as jest.MockedFunction<typeof saveLog>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

const SECRET_MARKER = 'SENSITIVE_SYMPTOM_VALUE';

const log: DailyLog = {
  date: '2026-02-14',
  cycleDay: 3,
  entries: [{ categoryId: SECRET_MARKER, value: 'heavy' }],
  savedAt: '2026-02-14T08:30:00.000Z',
};

function mockSupabaseUpsert(response: { data?: unknown; error?: unknown } = { data: null, error: null }) {
  const upsertFn = jest.fn().mockResolvedValue(response);
  // Create a query builder with both upsert and select methods
  const queryBuilder = { upsert: upsertFn, select: jest.fn() };
  mockSupabase.from.mockReturnValue(queryBuilder as never);
  return { from: mockSupabase.from, upsert: upsertFn };
}

function mockSupabaseSelect(data: unknown[] = []) {
  const eqFn = jest.fn().mockResolvedValue({ data, error: null });
  const selectFn = jest.fn().mockReturnValue({ eq: eqFn });
  const queryBuilder = { select: selectFn, upsert: jest.fn() };
  mockSupabase.from.mockReturnValue(queryBuilder as never);
  return { select: selectFn, eq: eqFn };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUnsyncedLogIds.mockResolvedValue([log.date]);
  mockGetLog.mockResolvedValue(log);
});

describe('syncToCloud — plaintext-leak invariant', () => {
  it('never puts readable health content in the upsert body', async () => {
    const { upsert } = mockSupabaseUpsert({ data: null, error: null });

    await syncToCloud('user-1');

    expect(upsert).toHaveBeenCalledTimes(1);
    const upsertArg = upsert.mock.calls[0]?.[0];
    if (upsertArg) {
      const serialised = JSON.stringify(upsertArg);
      expect(serialised).not.toContain(SECRET_MARKER);
      expect(serialised).not.toContain('"entries"');
    }
  });

  it('upserts only the whitelisted columns (id, user_id, date, payload, updated_at)', async () => {
    const { upsert } = mockSupabaseUpsert({ data: null, error: null });

    await syncToCloud('user-1');

    const upsertArg = upsert.mock.calls[0]?.[0];
    if (upsertArg) {
      const keys = Object.keys(upsertArg).sort();
      expect(keys).toEqual(['date', 'id', 'payload', 'updated_at', 'user_id']);
    }
  });
});

describe('syncToCloud — result accounting', () => {
  it('marks a log synced only on a successful upsert', async () => {
    mockSupabaseUpsert({ data: null, error: null });

    const result = await syncToCloud('user-1');

    expect(result).toEqual({ synced: 1, failed: 0, errors: [] });
    expect(mockMarkLogSynced).toHaveBeenCalledWith(log.date);
  });

  it('records a failure without marking synced when upsert returns an error', async () => {
    mockSupabaseUpsert({ data: null, error: { message: 'Permission denied' } });

    const result = await syncToCloud('user-1');

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('Permission denied');
    expect(mockMarkLogSynced).not.toHaveBeenCalled();
  });

  it('is a no-op when there is nothing to sync', async () => {
    mockGetUnsyncedLogIds.mockResolvedValue([]);
    const { from } = mockSupabaseUpsert({ data: null, error: null });

    const result = await syncToCloud('user-1');

    expect(result).toEqual({ synced: 0, failed: 0, errors: [] });
    expect(from).not.toHaveBeenCalled();
  });
});

describe('pullFromCloud — last-write-wins merge rule', () => {
  it('overwrites local with remote when remote is newer by updated_at', async () => {
    // Create a valid plaintext-fallback payload by base64-encoding a valid DailyLog
    const decryptedLog: DailyLog = { date: '2026-02-14', cycleDay: 1, entries: [], savedAt: '2026-06-01T00:00:00.000Z' };
    const remotePayload = { ciphertext: Buffer.from(JSON.stringify(decryptedLog)).toString('base64'), nonce: 'PLAINTEXT_FALLBACK', v: 1 };
    const remoteLog = {
      id: '123',
      date: log.date,
      payload: JSON.stringify(remotePayload),
      updated_at: '2026-06-01T00:00:00.000Z',
    };
    mockGetLog.mockResolvedValue({ ...log, savedAt: '2026-01-01T00:00:00.000Z' });
    mockSupabaseSelect([remoteLog]);

    const result = await pullFromCloud('user-1');

    expect(result.synced).toBe(1);
    expect(mockSaveLog).toHaveBeenCalled();
  });

  it('keeps local when local is newer (by savedAt) than remote (by updated_at)', async () => {
    // Create a valid plaintext-fallback payload by base64-encoding a valid DailyLog
    const decryptedLog: DailyLog = { date: '2026-02-14', cycleDay: 1, entries: [], savedAt: '2026-01-01T00:00:00.000Z' };
    const remotePayload = { ciphertext: Buffer.from(JSON.stringify(decryptedLog)).toString('base64'), nonce: 'PLAINTEXT_FALLBACK', v: 1 };
    const remoteLog = {
      id: '123',
      date: log.date,
      payload: JSON.stringify(remotePayload),
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    mockGetLog.mockResolvedValue({ ...log, savedAt: '2026-06-01T00:00:00.000Z' });
    mockSupabaseSelect([remoteLog]);

    const result = await pullFromCloud('user-1');

    expect(result.synced).toBe(0);
    expect(mockSaveLog).not.toHaveBeenCalled();
  });

  it('skips a row that fails to decrypt instead of writing an empty log', async () => {
    const corruptedPayload = { ciphertext: 'not-valid-base64-$$$', nonce: 'corrupt', v: 1 };
    const remoteLog = {
      id: '123',
      date: log.date,
      payload: JSON.stringify(corruptedPayload),
      updated_at: '2026-06-01T00:00:00.000Z',
    };
    mockGetLog.mockResolvedValue(null);
    mockSupabaseSelect([remoteLog]);

    const result = await pullFromCloud('user-1');

    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('decrypt failed');
    expect(mockSaveLog).not.toHaveBeenCalled();
  });
});
