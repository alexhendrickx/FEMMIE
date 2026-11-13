# Design — Supabase-only backend & multi-device E2EE sync

**Date:** 2026-11-06
**Author:** Alex (with Claude, senior pairing)
**Status:** awaiting approval → then `superpowers:writing-plans`

## Intent & why

Femmie currently has a custom Fastify backend (passkeys + PASETO + KMS wrap/unwrap)
that is **not deployed** — onboarding only works via an offline stub. The goal is a
backend that is **free to host, zero to maintain, and already familiar** to Alex, so the
app can be tested on multiple devices via TestFlight. Alex already uses **Supabase** on
another project and wants this app on the same flow.

Decision: go **Supabase-only**. Drop the Fastify server, PASETO, KMS, passkeys, and the
QR device-linking idea entirely. Replace with Supabase Auth + Supabase Postgres + RLS.

The product promise — **no readable health data ever leaves the device (E2EE)** — stays.
Supabase stores **ciphertext only**. This is non-negotiable (see CLAUDE.md).

## Goals

- All sync & auth run on Supabase; nothing else to host; stays within free tier.
- App installs and syncs on ≥2 iOS devices through TestFlight.
- A new device can **read existing data** after login + recovery passphrase.
- E2EE preserved: server sees only ciphertext + an encrypted (wrapped) key blob.

## Non-goals

- QR / device-to-device key transfer (explicitly dropped).
- Keeping passkeys, PASETO, Fastify, or the AWS KMS wrap/unwrap endpoints.
- Android / Health Connect parity for this change (iOS/TestFlight is the target).
- Realtime sync, conflict-resolution UI, multi-user sharing.

## Anti-goals (would make this a failure even if it "works")

- The server (Supabase) being technically able to read health/cycle plaintext.
- The recovery passphrase, the DEK, or any health field hitting a log, analytics, or a
  non-encrypted column.
- A device able to see another user's rows (RLS gap).

## Key-management model (the crux) — Option A: recovery passphrase

End-to-end encryption needs the data-encryption key (DEK) on every device, but the DEK
must never be server-readable. Chosen pattern (used by Proton, Bitwarden, Signal PIN):

1. On account creation the user picks a **recovery passphrase**.
2. Client derives a **key-encryption key (KEK)** from the passphrase via
   `crypto_pwhash` (Argon2id, libsodium — already in `encryption.ts`), with a random
   per-user salt.
3. The existing random **DEK** is wrapped (`crypto_secretbox`) with the KEK →
   `wrapped_dek` blob.
4. `wrapped_dek`, the `salt`, and KDF params are stored in Supabase (safe: useless
   without the passphrase).
5. **New device:** Supabase Auth login → fetch `wrapped_dek` + salt → user types
   passphrase → derive KEK → unwrap DEK → held in memory only, mirrored to the local
   iOS Keychain (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`) for subsequent launches.
6. Lose passphrase **and** all devices → data unrecoverable. This is the cost of real
   E2EE and must be stated in the recovery-setup UI.

This replaces the KMS envelope flow in `encryption.ts` (`wrapAndStoreDEK` / `loadDEK`)
with a local, passphrase-based wrap. `initLocalDEK` (device-only DEK) stays as the
first-launch generator; the passphrase step wraps that DEK for cross-device use.

## Data model (Supabase Postgres)

Mirror of the local SQLite `encrypted_logs` table, scoped per user.

```sql
-- logs: one encrypted blob per daily entry, owned by auth.uid()
create table public.logs (
  id          text not null,                 -- client-generated log id
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        text not null,                 -- plaintext date is acceptable metadata
  payload     text not null,                 -- JSON EncryptedPayload (ciphertext)
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.logs enable row level security;
create policy "own rows" on public.logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- key material: one wrapped DEK per user
create table public.key_material (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  wrapped_dek text not null,                 -- DEK encrypted with passphrase-KEK
  salt        text not null,
  kdf_params  jsonb not null,
  updated_at  timestamptz not null default now()
);
alter table public.key_material enable row level security;
create policy "own key" on public.key_material
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

> Open question for the builder → **answered**: `date` stays plaintext (it is already
> plaintext in the local schema and in the current sync payload; it is weak metadata,
> not a health field). Everything sensitive lives inside `payload`.

## Client changes

- **Add dep:** `@supabase/supabase-js` (flag & motivate — this is the one new dependency;
  it replaces `@simplewebauthn/*` and the PASETO/fetch auth code).
- **New:** `src/services/supabase.ts` — single configured client; URL + anon key from
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (public by design; RLS is
  the real guard). Session persisted via a SecureStore-backed storage adapter.
- **Rewrite `authService.ts`:** email+password (or magic link — builder's call, default
  email+password for offline-friendliness) via `supabase.auth`. Drop PASETO tokens,
  offline stubs, passkey ceremony. Keep the same exported surface where possible so
  callers (onboarding, App shell) change minimally.
- **Rewrite `cloudSync.ts`:** `supabase.from('logs').upsert(...)` for unsynced rows;
  add a **pull** path (new device downloads rows, decrypts, writes to SQLite). Encrypted
  payload is still produced by `encryption.ts` before upload — unchanged guarantee.
- **Rewrite key handling in `encryption.ts`:** replace `wrapAndStoreDEK`/`loadDEK` (KMS)
  with passphrase-based wrap/unwrap (Argon2id). `encrypt`/`decrypt` and the DEK itself
  are unchanged.
- **Onboarding UI:** add a recovery-passphrase step (set on new account; prompt on new
  device) with a clear "write this down, it cannot be reset" warning.
- **Remove:** `passkeyService.ts`, PASETO token types, KMS endpoints usage. Delete both
  `backend/` and `femmie/backend/` Fastify trees (or keep only if Alex wants history).

## Pure logic / privacy checkpoints

- KDF (passphrase → KEK) and wrap/unwrap go in `encryption.ts` (already the crypto home);
  no plaintext DEK or passphrase is persisted or logged.
- `cloudSync` error strings keep the existing PII-scrub pattern.
- DoD: `tsc --noEmit` clean (app); sync verified device→Supabase→second device with
  ciphertext-only rows confirmed in the Supabase table viewer.

## Left to the builder

- Email+password vs magic link (default: email+password).
- Exact onboarding passphrase-screen copy and placement in the stepper.
- Whether to delete the old `backend/` trees now or in a follow-up chore.
- Pull-sync merge rule (default: last-write-wins by `updated_at`; no UI needed for a
  2-device personal use case).

## Hosting & cost

- Supabase free tier: Postgres + Auth + 500MB DB — far beyond this app's encrypted-blob
  needs. Nothing to deploy, no server process, €0.
- Only unavoidable cost: Apple Developer account (€99/yr) for TestFlight — already have.

## TestFlight (Transporter flow — unchanged)

`eas build -p ios --profile preview` → download the `.ipa` → open in **Transporter** →
upload → it lands in App Store Connect → TestFlight → **Internal Testing** (up to 100
testers, no Apple review). Add the second device's Apple ID as an internal tester.
`EXPO_PUBLIC_AUTH_OFFLINE` can be dropped from the preview profile once Supabase auth is
live (real backend now exists).
