/**
 * Cloud sync against Supabase — push unsynced local logs, pull remote logs on
 * a new device. The server only ever receives/returns ciphertext payloads;
 * encryption/decryption happens here using the in-memory DEK from
 * services/encryption.ts. RLS on the `logs` table (see supabase/schema.sql)
 * is the only thing standing between one user's rows and another's — every
 * query below is implicitly scoped by the caller's authenticated session.
 */
import { supabase } from './supabase';
import { getUnsyncedLogIds, getLog, markLogSynced, saveLog } from './sqlite';
import { encrypt, decrypt } from './encryption';
import type { EncryptedPayload } from '../types/encryption';
import type { DailyLog } from '../types/logging';

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

function scrub(err: unknown): string {
  return String(err).replace(/date|entry|flow|mood/gi, '[redacted]');
}

/** Push all unsynced local logs to Supabase. Each log is re-encrypted before upload. */
export async function syncToCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  const unsyncedIds = await getUnsyncedLogIds();
  if (unsyncedIds.length === 0) return result;

  await Promise.all(
    unsyncedIds.map(async (id) => {
      try {
        const log = await getLog(id);
        if (!log) return;

        const encryptedPayload = encrypt(log);

        const { error } = await supabase.from('logs').upsert({
          id,
          user_id: userId,
          date: log.date,
          payload: JSON.stringify(encryptedPayload),
          updated_at: new Date().toISOString(),
        });

        if (!error) {
          await markLogSynced(id);
          result.synced++;
        } else {
          result.failed++;
          result.errors.push(`${id}: ${scrub(error.message)}`);
        }
      } catch (err) {
        result.failed++;
        result.errors.push(`${id}: ${scrub(err)}`);
      }
    }),
  );

  return result;
}

/**
 * Pull remote logs for this user and merge into local SQLite.
 * Merge rule: last-write-wins by `updated_at` — if the remote row is newer
 * than what's already local (or the log doesn't exist locally yet), overwrite
 * local with the decrypted remote value. Never writes ciphertext into the
 * decrypted DailyLog shape — decrypt() returning null for a row is skipped,
 * never treated as an empty log.
 */
export async function pullFromCloud(userId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  const { data, error } = await supabase
    .from('logs')
    .select('id, date, payload, updated_at')
    .eq('user_id', userId);

  if (error) {
    result.failed++;
    result.errors.push(scrub(error.message));
    return result;
  }

  for (const row of data ?? []) {
    try {
      const localLog = await getLog(row.date);
      // last-write-wins by updated_at: only overwrite if remote is newer than
      // what the local savedAt implies, or there is no local copy at all.
      if (localLog && localLog.savedAt && localLog.savedAt >= row.updated_at) {
        continue;
      }
      const payload = JSON.parse(row.payload) as EncryptedPayload;
      const decrypted = decrypt<DailyLog>(payload);
      if (!decrypted) {
        result.failed++;
        result.errors.push(`${row.id}: decrypt failed`);
        continue;
      }
      await saveLog(decrypted);
      await markLogSynced(row.id);
      result.synced++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${row.id}: ${scrub(err)}`);
    }
  }

  return result;
}
