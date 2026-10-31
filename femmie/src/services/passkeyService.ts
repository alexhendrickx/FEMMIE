/**
 * Device-native passkey wrapper.
 *
 * Attempts to use the platform passkey API (react-native-passkeys).
 * Falls back to expo-local-authentication + a device-bound key in SecureStore
 * when the native module is unavailable (Expo Go, simulator).
 *
 * The fallback is NOT production-safe — it's a dev convenience only.
 */
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY_ID = 'femmie_device_key';

// Native platform passkeys require an Associated Domains entitlement
// (webcredentials:<rpId>) plus a hosted apple-app-site-association file. Until
// that infrastructure is deployed, create()/get() cannot succeed on-device, so
// we stay on the dev fallback. A production build with domain association live
// calls configurePasskeys({ allowNativePasskeys: true }) at startup to switch on
// the real platform API.
let _allowNativePasskeys = false;

/**
 * Enable device-native platform passkeys.
 * Only pass `true` once the app's Associated Domains entitlement and the
 * apple-app-site-association file for the relying-party domain are live —
 * otherwise registration/login will fail on-device.
 */
export function configurePasskeys(opts: { allowNativePasskeys: boolean }): void {
  _allowNativePasskeys = opts.allowNativePasskeys;
}

type PasskeyCreateResult = { id: string; rawId: string; response: Record<string, string>; type: string };
type PasskeyGetResult    = { id: string; rawId: string; response: Record<string, string>; type: string };

// ─── Attempt native passkey API ───────────────────────────────────────────────

// react-native-passkeys exports flat functions (isSupported/create/get), not a
// `Passkey` namespace. The native call can resolve to `null` (e.g. user cancel).
type NativePasskeys = {
  isSupported: () => boolean;
  create: (opts: unknown) => Promise<PasskeyCreateResult | null>;
  get:    (opts: unknown) => Promise<PasskeyGetResult | null>;
};

function getNativePasskeys(): NativePasskeys | null {
  // Gated until domain association exists — otherwise native passkeys fail
  // on-device. Falls through to the dev fallback (biometrics + SecureStore).
  if (!_allowNativePasskeys) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-passkeys') as Partial<NativePasskeys>;
    // Verify the real native API is present before trusting it — guards against a
    // stubbed/partial module so we fall back cleanly instead of crashing.
    if (
      typeof mod?.isSupported !== 'function' ||
      typeof mod?.create !== 'function' ||
      typeof mod?.get !== 'function'
    ) {
      return null;
    }
    return mod as NativePasskeys;
  } catch {
    return null;
  }
}

// ─── Dev fallback: local auth + synthetic credential ─────────────────────────

async function devFallbackCreate(
  challenge: string,
  userId: string,
): Promise<PasskeyCreateResult> {
  let LocalAuth: typeof import('expo-local-authentication') | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    LocalAuth = require('expo-local-authentication');
  } catch {
    // In Expo Go without local auth
  }

  if (LocalAuth) {
    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Set up Face ID / fingerprint for Femmie',
      fallbackLabel: 'Use device PIN',
    });
    if (!result.success) throw new Error('Biometric auth cancelled');
  }

  // Generate a synthetic device-bound identifier stored in SecureStore
  const keyId = `${userId}-${Date.now()}`;
  await SecureStore.setItemAsync(DEVICE_KEY_ID, keyId);

  return {
    id: keyId,
    rawId: keyId,
    response: {
      clientDataJSON: btoa(JSON.stringify({ challenge, type: 'webauthn.create' })),
      attestationObject: btoa('dev-fallback'),
    },
    type: 'public-key',
  };
}

async function devFallbackGet(challenge: string): Promise<PasskeyGetResult> {
  let LocalAuth: typeof import('expo-local-authentication') | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    LocalAuth = require('expo-local-authentication');
  } catch { /* */ }

  if (LocalAuth) {
    const result = await LocalAuth.authenticateAsync({
      promptMessage: 'Confirm your identity',
      fallbackLabel: 'Use device PIN',
    });
    if (!result.success) throw new Error('Biometric auth cancelled');
  }

  const credentialId = await SecureStore.getItemAsync(DEVICE_KEY_ID);
  if (!credentialId) throw new Error('No passkey found on this device');

  return {
    id: credentialId,
    rawId: credentialId,
    response: {
      clientDataJSON: btoa(JSON.stringify({ challenge, type: 'webauthn.get' })),
      authenticatorData: btoa('dev-fallback'),
      signature: btoa('dev-signature'),
    },
    type: 'public-key',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createPasskey(
  challenge: string,
  userId: string,
  rpId: string,
): Promise<PasskeyCreateResult> {
  const native = getNativePasskeys();

  if (native?.isSupported()) {
    const result = await native.create({
      rp: { id: rpId, name: 'Femmie' },
      user: { id: userId, name: userId, displayName: 'Femmie User' },
      challenge,
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
    });
    if (!result) throw new Error('Passkey creation returned no credential');
    return result;
  }

  return devFallbackCreate(challenge, userId);
}

export async function getPasskey(
  challenge: string,
  rpId: string,
): Promise<PasskeyGetResult> {
  const native = getNativePasskeys();

  if (native?.isSupported()) {
    const result = await native.get({
      rpId,
      challenge,
      userVerification: 'required',
    });
    if (!result) throw new Error('Passkey authentication returned no credential');
    return result;
  }

  return devFallbackGet(challenge);
}

export async function hasExistingPasskey(): Promise<boolean> {
  const native = getNativePasskeys();
  if (native?.isSupported()) return true; // Platform handles credential lookup
  const stored = await SecureStore.getItemAsync(DEVICE_KEY_ID);
  return stored !== null;
}
