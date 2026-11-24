/**
 * The health store records which data types sync and when. That is health data,
 * so it must reach AsyncStorage encrypted, and an older plaintext blob must still load.
 */
const mockMem = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => mockMem.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void mockMem.set(k, v)),
    removeItem: jest.fn(async (k: string) => void mockMem.delete(k)),
  },
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

import { useHealthStore } from '../healthStore';
import { encryptedWritesSettled } from '../../services/secureStorage';

beforeEach(() => mockMem.clear());

it('writes an encrypted envelope with no plaintext data-type ids', async () => {
  useHealthStore.getState().togglePaused('resting_heart_rate');
  useHealthStore.getState().recordSyncEvent({
    dataTypeId: 'workouts',
    status: 'success',
    timestamp: '2026-11-23T08:00:00Z',
    direction: 'read',
  });
  await encryptedWritesSettled();

  const onDisk = mockMem.get('femmie-health')!;
  expect(onDisk).not.toContain('resting_heart_rate');
  expect(onDisk).not.toContain('workouts');
  const envelope = JSON.parse(onDisk);
  expect(typeof envelope.ciphertext).toBe('string');
  expect(typeof envelope.nonce).toBe('string');
});

it('hydrates a plaintext blob from an older build', async () => {
  mockMem.set(
    'femmie-health',
    JSON.stringify({ state: { permissionStatus: 'granted', pausedIds: ['resting_heart_rate'] }, version: 0 }),
  );
  await useHealthStore.persist.rehydrate();

  expect(useHealthStore.getState().permissionStatus).toBe('granted');
  expect(useHealthStore.getState().isPaused('resting_heart_rate')).toBe(true);

  // The plaintext copy is replaced by ciphertext straight after hydration.
  await encryptedWritesSettled();
  const onDisk = mockMem.get('femmie-health')!;
  expect(onDisk).not.toContain('resting_heart_rate');
  expect(typeof JSON.parse(onDisk).ciphertext).toBe('string');
});

it('hydrates a fresh install (nothing stored) without throwing', async () => {
  await expect(useHealthStore.persist.rehydrate()).resolves.not.toThrow();
});
