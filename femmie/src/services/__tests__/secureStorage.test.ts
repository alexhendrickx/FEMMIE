/**
 * Tests for the encrypted Zustand persistence adapter.
 *
 * libsodium is absent in Node, so these run through the dev plaintext-fallback
 * path — but they still lock the two invariants that matter for the privacy fix:
 *   1. what lands in AsyncStorage is an EncryptedPayload envelope, never the bare
 *      state blob;
 *   2. legacy pre-encryption data still hydrates (no data loss on upgrade).
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

import { encryptedStorage } from '../secureStorage';

beforeEach(() => mockMem.clear());

describe('encryptedStorage', () => {
  it('round-trips persisted state', async () => {
    const state = JSON.stringify({ state: { logs: { '2026-02-14': { mood: 'low' } } } });
    await encryptedStorage.setItem('femmie-logs', state);
    expect(await encryptedStorage.getItem('femmie-logs')).toBe(state);
  });

  it('never writes the raw state blob to disk', async () => {
    await encryptedStorage.setItem('femmie-logs', JSON.stringify({ flow: 'heavy' }));
    const onDisk = mockMem.get('femmie-logs')!;
    expect(onDisk).not.toContain('heavy');
    const envelope = JSON.parse(onDisk);
    expect(typeof envelope.ciphertext).toBe('string');
    expect(typeof envelope.nonce).toBe('string');
  });

  it('hydrates legacy pre-encryption plaintext, then re-encrypts on next write', async () => {
    const legacy = JSON.stringify({ state: { logs: {} } });
    mockMem.set('femmie-logs', legacy); // simulate an old plaintext install
    expect(await encryptedStorage.getItem('femmie-logs')).toBe(legacy);

    await encryptedStorage.setItem('femmie-logs', legacy);
    expect(mockMem.get('femmie-logs')).not.toBe(legacy);
    expect(JSON.parse(mockMem.get('femmie-logs')!).ciphertext).toBeDefined();
  });

  it('returns null for a missing key', async () => {
    expect(await encryptedStorage.getItem('nope')).toBeNull();
  });
});
