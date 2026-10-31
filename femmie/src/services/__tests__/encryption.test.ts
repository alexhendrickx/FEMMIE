/**
 * Tests for the client-side encryption service.
 *
 * libsodium is not installed in the test/Node environment, so these tests
 * exercise the service's own wiring and — critically — its fail-closed guard:
 * the invariant that readable plaintext is NEVER produced once the app opts
 * into production safety. (The cryptographic primitive itself is covered by
 * libsodium's own test suite; real round-trip crypto tests are a follow-up
 * gated on adding a libsodium dev dependency.)
 */
import { encrypt, decrypt, configureEncryption } from '../encryption';
import type { EncryptedPayload } from '../../types/encryption';
import type { DailyLog } from '../../types/logging';

const sampleLog: DailyLog = {
  date: '2026-02-14',
  cycleDay: 3,
  entries: [
    { categoryId: 'menstrual_flow', value: 'heavy' },
    { categoryId: 'mood', value: 'low' },
  ],
  savedAt: '2026-02-14T08:30:00.000Z',
};

afterEach(() => {
  // Reset to the permissive default so one test can't leak mode into the next.
  configureEncryption({ allowPlaintextFallback: true });
});

describe('encrypt / decrypt (dev fallback mode)', () => {
  it('round-trips a value back to its original form', () => {
    const payload = encrypt(sampleLog);
    const restored = decrypt<DailyLog>(payload);
    expect(restored).toEqual(sampleLog);
  });

  it('produces a versioned EncryptedPayload shape', () => {
    const payload = encrypt(sampleLog);
    expect(payload).toEqual(
      expect.objectContaining({
        ciphertext: expect.any(String),
        nonce: expect.any(String),
        v: 1,
      }),
    );
  });

  it('returns null when decrypting a corrupted payload', () => {
    const garbage: EncryptedPayload = {
      ciphertext: 'not-valid-base64-$$$',
      nonce: 'PLAINTEXT_FALLBACK',
      v: 1,
    };
    expect(decrypt(garbage)).toBeNull();
  });
});

describe('fail-closed production guard', () => {
  it('throws instead of emitting readable plaintext when fallback is disabled', () => {
    configureEncryption({ allowPlaintextFallback: false });
    // With no libsodium and no DEK, the only way to "encrypt" would be the
    // readable fallback — which must be refused loudly, not performed silently.
    expect(() => encrypt(sampleLog)).toThrow(/fallback is disabled/);
  });

  it('refuses to interpret an unencrypted payload when fallback is disabled', () => {
    // A payload that was written in dev fallback must not be readable once the
    // app has switched to fail-closed mode.
    const fallbackPayload = encrypt(sampleLog); // written while permissive
    configureEncryption({ allowPlaintextFallback: false });
    expect(decrypt(fallbackPayload)).toBeNull();
  });
});

describe('plaintext-leak invariant', () => {
  it('never exposes raw health values as readable JSON in the payload', () => {
    // Even in dev fallback the content is base64-wrapped, so a naive grep of
    // the serialised payload must not reveal the plaintext category/value.
    const payload = encrypt(sampleLog);
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toContain('menstrual_flow');
    expect(serialised).not.toContain('heavy');
    expect(serialised).not.toContain('"mood"');
  });
});
