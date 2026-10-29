-- Migration 002: passkey authentication tables
BEGIN;

-- Core accounts table (accounts created in 001 may already exist)
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_email
  ON accounts (email) WHERE email IS NOT NULL;

-- Device-bound passkey credentials (one account can have multiple devices)
CREATE TABLE IF NOT EXISTS passkey_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  credential_id   TEXT NOT NULL UNIQUE,   -- base64url-encoded credential ID
  public_key      TEXT NOT NULL,          -- COSE-encoded public key (base64)
  aaguid          TEXT,                   -- authenticator model identifier
  device_type     TEXT NOT NULL DEFAULT 'singleDevice',
  sign_count      BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_passkey_account
  ON passkey_credentials (account_id);

-- Pending WebAuthn challenges (short-lived, cleaned up after use)
CREATE TABLE IF NOT EXISTS auth_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge   TEXT NOT NULL UNIQUE,
  account_id  UUID REFERENCES accounts(id) ON DELETE CASCADE, -- NULL during registration
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_challenges_expires
  ON auth_challenges (expires_at);

-- Refresh tokens (one row per active session)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,  -- SHA-256 of the raw token
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_account
  ON refresh_tokens (account_id)
  WHERE revoked_at IS NULL;

-- Auto-clean expired challenges (pg_cron or called manually)
CREATE OR REPLACE FUNCTION clean_expired_challenges()
RETURNS void LANGUAGE sql AS $$
  DELETE FROM auth_challenges WHERE expires_at < now();
$$;

COMMIT;
