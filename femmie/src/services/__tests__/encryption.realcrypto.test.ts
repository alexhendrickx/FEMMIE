/**
 * REAL cryptographic round-trip tests for the encryption service.
 *
 * The native module `react-native-libsodium` (JSI) cannot load under Node/jest,
 * so the default encryption test suite only exercises the base64 "plaintext
 * fallback". Here we mock `react-native-libsodium` with `libsodium-wrappers` —
 * a pure JS/WASM build of libsodium that exposes the SAME synchronous API after
 * `await sodium.ready`. That lets us prove the actual XSalsa20-Poly1305 path:
 * ciphertext is unreadable, tampering is detected, and a wrong key fails to
 * decrypt. We run with `allowPlaintextFallback: false`, so if real crypto were
 * NOT running, encrypt() would throw instead of silently base64-encoding.
 */
import sodium from 'libsodium-wrappers';
import { encrypt, decrypt, generateDEK, configureEncryption } from '../encryption';
import type { EncryptedPayload } from '../../types/encryption';
import type { DailyLog } from '../../types/logging';

// Swap the native module for the WASM implementation with the identical API.
jest.mock('react-native-libsodium', () => require('libsodium-wrappers'));

const sampleLog: DailyLog = {
  date: '2026-02-14',
  cycleDay: 3,
  entries: [
    { categoryId: 'menstrual_flow', value: 'heavy' },
    { categoryId: 'mood', value: 'low' },
  ],
  savedAt: '2026-02-14T08:30:00.000Z',
};

beforeAll(async () => {
  // libsodium-wrappers is only usable after its WASM is ready.
  await sodium.ready;
  // Put a REAL DEK in memory and forbid the dev fallback: now the only way
  // encrypt/decrypt can succeed is via genuine libsodium crypto.
  await generateDEK();
  configureEncryption({ allowPlaintextFallback: false });
});

afterAll(() => {
  // Restore the permissive default so the other ~244 tests (which run without
  // libsodium) keep working.
  configureEncryption({ allowPlaintextFallback: true });
});

describe('encryption service — real libsodium crypto', () => {
  it('round-trips an object through encrypt → decrypt', () => {
    const payload = encrypt(sampleLog);
    const restored = decrypt<DailyLog>(payload);
    expect(restored).toEqual(sampleLog);
  });

  it('produces real ciphertext — not the plaintext, not the dev fallback', () => {
    const payload = encrypt(sampleLog);

    // A real random nonce, never the fallback sentinel.
    expect(payload.nonce).not.toBe('PLAINTEXT_FALLBACK');
    // crypto_secretbox nonce is 24 bytes → 32 base64 chars.
    const nonceBytes = Buffer.from(payload.nonce, 'base64');
    expect(nonceBytes.length).toBe(sodium.crypto_secretbox_NONCEBYTES);

    const plaintext = JSON.stringify(sampleLog);
    // The ciphertext must not equal nor contain the readable plaintext, and a
    // base64-decode of it must not reveal the sensitive values either.
    expect(payload.ciphertext).not.toBe(plaintext);
    expect(payload.ciphertext).not.toContain('menstrual_flow');
    expect(payload.ciphertext).not.toContain('heavy');
    const decoded = Buffer.from(payload.ciphertext, 'base64').toString('utf8');
    expect(decoded).not.toContain('menstrual_flow');
    expect(decoded).not.toContain('heavy');
  });

  it('returns null when the ciphertext has been tampered with', () => {
    const payload = encrypt(sampleLog);

    // Flip one byte of the authenticated ciphertext → Poly1305 tag check fails.
    const bytes = Buffer.from(payload.ciphertext, 'base64');
    bytes[0] ^= 0xff;
    const tampered: EncryptedPayload = {
      ...payload,
      ciphertext: bytes.toString('base64'),
    };

    expect(decrypt(tampered)).toBeNull();
  });

  it('returns null when decrypting with a different key', () => {
    // Capture a payload encrypted under the current DEK...
    const payload = encrypt(sampleLog);

    // ...then rotate to a brand-new DEK. The old ciphertext must no longer open.
    return generateDEK().then(() => {
      expect(decrypt(payload)).toBeNull();
    });
  });
});
