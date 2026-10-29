-- Migration 001: soft-delete support + wipe tracking
-- Run once against the production database before deploying the wipe endpoints.

BEGIN;

-- ─── accounts table (create if not already present) ──────────────────────────

CREATE TABLE IF NOT EXISTS accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Soft-delete columns ──────────────────────────────────────────────────────

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wipe_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wipe_mode         TEXT CHECK (wipe_mode IN ('soft', 'immediate'));

-- Partial index: efficient lookup of accounts pending deletion
CREATE INDEX IF NOT EXISTS idx_accounts_pending_wipe
  ON accounts (wipe_requested_at)
  WHERE wipe_requested_at IS NOT NULL AND deleted_at IS NULL;

-- ─── encrypted_logs table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS encrypted_logs (
  id            TEXT PRIMARY KEY,
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  payload       TEXT NOT NULL,  -- base64(ciphertext) — server never decrypts
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ          -- soft-deleted rows are excluded from sync
);

CREATE INDEX IF NOT EXISTS idx_encrypted_logs_account_date
  ON encrypted_logs (account_id, date)
  WHERE deleted_at IS NULL;

-- ─── Helper: mark account + all its logs as soft-deleted ─────────────────────

CREATE OR REPLACE FUNCTION soft_delete_account(p_account_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE encrypted_logs
     SET deleted_at = now()
   WHERE account_id = p_account_id AND deleted_at IS NULL;

  UPDATE accounts
     SET deleted_at = now()
   WHERE id = p_account_id;
END;
$$;

COMMIT;
