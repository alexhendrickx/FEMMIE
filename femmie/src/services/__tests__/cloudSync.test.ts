/**
 * Tests for cloud sync — the code path where data actually leaves the device.
 *
 * The product promise is "no readable health data ever leaves the device", so
 * the headline test here inspects the real bytes put on the wire and asserts
 * that no plaintext health content appears in them. The SQLite layer is mocked
 * so the test is hermetic; encryption runs for real (in dev-fallback mode).
 */
import { syncToCloud } from '../cloudSync';
import type { DailyLog } from '../../types/logging';

jest.mock('../sqlite', () => ({
  getUnsyncedLogIds: jest.fn(),
  getLog: jest.fn(),
  markLogSynced: jest.fn(),
}));

import { getUnsyncedLogIds, getLog, markLogSynced } from '../sqlite';

const mockGetUnsyncedLogIds = getUnsyncedLogIds as jest.MockedFunction<typeof getUnsyncedLogIds>;
const mockGetLog = getLog as jest.MockedFunction<typeof getLog>;
const mockMarkLogSynced = markLogSynced as jest.MockedFunction<typeof markLogSynced>;

const SECRET_MARKER = 'SENSITIVE_SYMPTOM_VALUE';

const log: DailyLog = {
  date: '2026-02-14',
  cycleDay: 3,
  entries: [{ categoryId: SECRET_MARKER, value: 'heavy' }],
  savedAt: '2026-02-14T08:30:00.000Z',
};

function mockFetch(responder: () => Partial<Response>) {
  const fn = jest.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(responder() as Response),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUnsyncedLogIds.mockResolvedValue([log.date]);
  mockGetLog.mockResolvedValue(log);
});

describe('syncToCloud — plaintext-leak invariant', () => {
  it('never puts readable health content on the wire', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, status: 200 }));

    await syncToCloud('https://api.example', 'token');

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const init = fetchFn.mock.calls[0]![1]!;
    const rawBody = String(init.body);

    // The symptom content must be ciphertext, never a readable substring.
    expect(rawBody).not.toContain(SECRET_MARKER);
    expect(rawBody).not.toContain('"entries"');
  });

  it('sends only the whitelisted envelope fields (id, date, encryptedPayload)', async () => {
    const fetchFn = mockFetch(() => ({ ok: true, status: 200 }));

    await syncToCloud('https://api.example', 'token');

    const init = fetchFn.mock.calls[0]![1]!;
    const body = JSON.parse(String(init.body));
    expect(Object.keys(body).sort()).toEqual(['date', 'encryptedPayload', 'id']);
    expect(body.encryptedPayload).toEqual(
      expect.objectContaining({ ciphertext: expect.any(String), v: 1 }),
    );
  });
});

describe('syncToCloud — result accounting', () => {
  it('marks a log synced only on a successful response', async () => {
    mockFetch(() => ({ ok: true, status: 200 }));

    const result = await syncToCloud('https://api.example', 'token');

    expect(result).toEqual({ synced: 1, failed: 0, errors: [] });
    expect(mockMarkLogSynced).toHaveBeenCalledWith(log.date);
  });

  it('records a failure without marking synced on a non-ok response', async () => {
    mockFetch(() => ({ ok: false, status: 500 }));

    const result = await syncToCloud('https://api.example', 'token');

    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('HTTP 500');
    expect(mockMarkLogSynced).not.toHaveBeenCalled();
  });

  it('is a no-op when there is nothing to sync', async () => {
    mockGetUnsyncedLogIds.mockResolvedValue([]);
    const fetchFn = mockFetch(() => ({ ok: true, status: 200 }));

    const result = await syncToCloud('https://api.example', 'token');

    expect(result).toEqual({ synced: 0, failed: 0, errors: [] });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
