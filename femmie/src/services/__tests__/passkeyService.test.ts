/**
 * Tests for the passkey service's native-vs-fallback gating.
 *
 * Native platform passkeys require Associated Domains + a hosted AASA file, which
 * are not present in dev/test. The service must therefore default to the dev
 * fallback (biometrics + a SecureStore device key) so onboarding/login work
 * on-device without that infrastructure. These tests pin that default: with the
 * gate off, `hasExistingPasskey()` reflects the SecureStore device key rather
 * than unconditionally trusting the platform.
 */
import { hasExistingPasskey, configurePasskeys } from '../passkeyService';
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY_ID = 'femmie_device_key';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      store.delete(k);
    }),
  };
});

afterEach(async () => {
  // Reset to the safe default and clear state so tests don't leak into each other.
  configurePasskeys({ allowNativePasskeys: false });
  await SecureStore.deleteItemAsync(DEVICE_KEY_ID);
});

describe('passkey native gate (dev fallback by default)', () => {
  it('reports no passkey when none has been created on this device', async () => {
    expect(await hasExistingPasskey()).toBe(false);
  });

  it('reports an existing passkey once a device key is stored', async () => {
    await SecureStore.setItemAsync(DEVICE_KEY_ID, 'user-123');
    expect(await hasExistingPasskey()).toBe(true);
  });
});
