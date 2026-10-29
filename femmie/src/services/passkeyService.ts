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

type PasskeyCreateResult = { id: string; rawId: string; response: Record<string, string>; type: string };
type PasskeyGetResult    = { id: string; rawId: string; response: Record<string, string>; type: string };

// ─── Attempt native passkey API ───────────────────────────────────────────────

function getNativePasskeys() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-passkeys') as {
      Passkey: {
        create: (opts: unknown) => Promise<PasskeyCreateResult>;
        get:    (opts: unknown) => Promise<PasskeyGetResult>;
        isSupported: () => boolean;
      };
    };
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

  if (native?.Passkey.isSupported()) {
    return native.Passkey.create({
      rp: { id: rpId, name: 'Femmie' },
      user: { id: userId, name: userId, displayName: 'Femmie User' },
      challenge,
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: { userVerification: 'required', residentKey: 'required' },
    });
  }

  return devFallbackCreate(challenge, userId);
}

export async function getPasskey(
  challenge: string,
  rpId: string,
): Promise<PasskeyGetResult> {
  const native = getNativePasskeys();

  if (native?.Passkey.isSupported()) {
    return native.Passkey.get({
      rpId,
      challenge,
      userVerification: 'required',
    });
  }

  return devFallbackGet(challenge);
}

export async function hasExistingPasskey(): Promise<boolean> {
  const native = getNativePasskeys();
  if (native?.Passkey.isSupported()) return true; // Platform handles credential lookup
  const stored = await SecureStore.getItemAsync(DEVICE_KEY_ID);
  return stored !== null;
}
