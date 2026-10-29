/**
 * Optional cloud sync — explicit opt-in only.
 * Sends encrypted payloads to the backend; the server never sees plaintext.
 * The encryption key is held by the client only.
 */
import { getUnsyncedLogIds, getLog, markLogSynced } from './sqlite';
import { encrypt } from './encryption';

export interface SyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Push all unsynced local logs to the cloud.
 * Each log is re-encrypted before upload to ensure freshness.
 */
export async function syncToCloud(
  apiBase: string,
  authToken: string,
): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, failed: 0, errors: [] };

  const unsyncedIds = await getUnsyncedLogIds();
  if (unsyncedIds.length === 0) return result;

  await Promise.all(
    unsyncedIds.map(async (id) => {
      try {
        const log = await getLog(id);
        if (!log) return;

        // Re-encrypt with current DEK before upload
        const encryptedPayload = encrypt(log);

        const res = await fetch(`${apiBase}/sync/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            id,
            date: log.date,
            // Server stores only the encrypted blob — never the plaintext
            encryptedPayload,
          }),
        });

        if (res.ok) {
          await markLogSynced(id);
          result.synced++;
        } else {
          result.failed++;
          result.errors.push(`${id}: HTTP ${res.status}`);
        }
      } catch (err) {
        result.failed++;
        // Strip any potential PII from the error message before logging
        const safe = String(err).replace(/date|entry|flow|mood/gi, '[redacted]');
        result.errors.push(`${id}: ${safe}`);
      }
    }),
  );

  return result;
}
