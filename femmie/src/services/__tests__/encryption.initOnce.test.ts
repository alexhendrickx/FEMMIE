/**
 * Two encrypted stores (logs, health) hydrate at the same time on launch. On a fresh
 * install they must agree on one key: two keys would leave memory and keychain out of
 * step, and the data would not decrypt after a restart.
 */
jest.mock('react-native-libsodium', () => require('libsodium-wrappers'));

const mockKeychain = new Map<string, string>();
const mockSetItem = jest.fn(async (k: string, v: string) => {
  // Yield so concurrent callers interleave like the real async keychain.
  await new Promise((r) => setTimeout(r, 5));
  mockKeychain.set(k, v);
});

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'x',
  getItemAsync: jest.fn(async (k: string) => mockKeychain.get(k) ?? null),
  setItemAsync: (k: string, v: string) => mockSetItem(k, v),
  deleteItemAsync: jest.fn(async (k: string) => void mockKeychain.delete(k)),
}));

import sodium from 'libsodium-wrappers';
import { initLocalDEK, encrypt, decrypt, wipeLocal } from '../encryption';

beforeAll(async () => {
  await sodium.ready;
});

it('concurrent first launches create exactly one key', async () => {
  await wipeLocal();
  mockSetItem.mockClear();

  const results = await Promise.all([initLocalDEK(), initLocalDEK(), initLocalDEK()]);

  expect(results).toEqual([true, true, true]);
  expect(mockSetItem).toHaveBeenCalledTimes(1);

  // What is in memory matches the keychain: data survives a restart.
  const payload = encrypt({ flow: 'heavy' });
  await wipeLocalMemoryOnly();
  await initLocalDEK();
  expect(decrypt<{ flow: string }>(payload)).toEqual({ flow: 'heavy' });
});

/** Simulate an app restart: drop the in-memory key but keep the keychain. */
async function wipeLocalMemoryOnly(): Promise<void> {
  const saved = new Map(mockKeychain);
  await wipeLocal();
  for (const [k, v] of saved) mockKeychain.set(k, v);
}
