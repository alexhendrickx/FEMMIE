/**
 * "Delete everything" must be honest: the server delete runs first, and a
 * failure leaves every local byte in place so the user can retry.
 */
const mockMem = new Map<string, string>();
const mockCalls: string[] = [];
const mockRpc = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockMem.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void mockMem.set(k, v)),
    removeItem: jest.fn(async (k: string) => void mockMem.delete(k)),
  },
}));
jest.mock('../secureStorage', () => ({
  encryptedStorage: {
    getItem: async (k: string) => mockMem.get(k) ?? null,
    setItem: async (k: string, v: string) => void mockMem.set(k, v),
    removeItem: async (k: string) => void mockMem.delete(k),
  },
}));
jest.mock('../supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: { signOut: jest.fn(async () => void mockCalls.push('signOut')) },
  },
}));
jest.mock('../encryption', () => ({
  wipeLocal: jest.fn(async () => void mockCalls.push('wipeLocal')),
}));
jest.mock('../sqlite', () => ({
  wipeDatabase: jest.fn(async () => void mockCalls.push('wipeDatabase')),
}));
jest.mock('../../utils/notifications', () => ({
  cancelBedtimeReminder: jest.fn(async () => void mockCalls.push('cancelReminder')),
}));

import { deleteAccountAndData, AccountDeletionError } from '../accountDeletion';
import { useLogStore } from '../../store/logStore';
import { useHealthStore } from '../../store/healthStore';
import { useEncryptionStore } from '../../store/encryptionStore';

function seed(): void {
  useLogStore.getState().saveLog({ date: '2026-11-01', cycleDay: 1, entries: [] });
  useLogStore.getState().completeOnboarding();
  useHealthStore.getState().setPermissionStatus('granted');
  useEncryptionStore.getState().setCloudSync(true);
  mockMem.set('femmie-mood', 'x');
}

beforeEach(() => {
  mockCalls.length = 0;
  mockRpc.mockReset();
  mockMem.clear();
  seed();
});

it('server failure: throws and leaves all local data untouched', async () => {
  mockRpc.mockResolvedValue({ error: { message: 'network' } });

  await expect(deleteAccountAndData(true)).rejects.toBeInstanceOf(AccountDeletionError);

  expect(mockCalls).toEqual([]);
  expect(Object.keys(useLogStore.getState().logs)).toEqual(['2026-11-01']);
  expect(useHealthStore.getState().permissionStatus).toBe('granted');
  expect(mockMem.has('femmie-mood')).toBe(true);
});

it('success: deletes the account first, then wipes every local store and key', async () => {
  mockRpc.mockImplementation(async (fn: string) => {
    mockCalls.push(`rpc:${fn}`);
    return { error: null };
  });

  await deleteAccountAndData(true);

  expect(mockCalls).toEqual([
    'rpc:delete_my_account',
    'cancelReminder',
    'wipeLocal',
    'wipeDatabase',
    'signOut',
  ]);
  expect(useLogStore.getState().logs).toEqual({});
  expect(useLogStore.getState().onboardingDone).toBe(false);
  expect(useHealthStore.getState().permissionStatus).toBe('not_determined');
  expect(useEncryptionStore.getState().cloudSyncEnabled).toBe(false);
  for (const key of ['femmie-logs', 'femmie-health', 'femmie-encryption', 'femmie-mood']) {
    expect(mockMem.has(key)).toBe(false);
  }
});

it('not signed in: wipes the device without calling the server', async () => {
  await deleteAccountAndData(false);

  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockCalls).toEqual(['cancelReminder', 'wipeLocal', 'wipeDatabase']);
  expect(useLogStore.getState().logs).toEqual({});
});
