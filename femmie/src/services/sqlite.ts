/**
 * Local-first SQLite store using expo-sqlite.
 * All user-generated content (logs, settings) is stored as encrypted blobs.
 * The schema itself (table names, column names) is not encrypted.
 *
 * Install: npx expo install expo-sqlite
 */
import * as SQLite from 'expo-sqlite';
import { encrypt, decrypt } from './encryption';
import type { EncryptedPayload } from '../types/encryption';
import type { DailyLog } from '../types/logging';

const DB_NAME = 'femmie.db';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS encrypted_logs (
      id        TEXT PRIMARY KEY,
      date      TEXT NOT NULL,
      payload   TEXT NOT NULL,  -- JSON-serialised EncryptedPayload
      synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_logs_date ON encrypted_logs(date);

    CREATE TABLE IF NOT EXISTS sync_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return _db;
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export async function saveLog(log: DailyLog): Promise<void> {
  const db = await getDB();
  const payload = encrypt(log);
  await db.runAsync(
    `INSERT INTO encrypted_logs (id, date, payload, created_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, synced_at = NULL`,
    [`${log.date}`, log.date, JSON.stringify(payload)],
  );
}

export async function getLog(date: string): Promise<DailyLog | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM encrypted_logs WHERE date = ?',
    [date],
  );
  if (!row) return null;
  const payload = JSON.parse(row.payload) as EncryptedPayload;
  return decrypt<DailyLog>(payload);
}

export async function getAllLogs(): Promise<DailyLog[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ payload: string }>(
    'SELECT payload FROM encrypted_logs ORDER BY date DESC',
  );
  return rows
    .map((r) => decrypt<DailyLog>(JSON.parse(r.payload)))
    .filter((l): l is DailyLog => l !== null);
}

/** Returns IDs of logs that haven't been synced to the cloud yet */
export async function getUnsyncedLogIds(): Promise<string[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM encrypted_logs WHERE synced_at IS NULL',
  );
  return rows.map((r) => r.id);
}

export async function markLogSynced(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE encrypted_logs SET synced_at = datetime('now') WHERE id = ?`,
    [id],
  );
}

// ─── Sync meta ────────────────────────────────────────────────────────────────

export async function getSyncMeta(key: string): Promise<string | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM sync_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    'INSERT INTO sync_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

// ─── Wipe ─────────────────────────────────────────────────────────────────────

/**
 * Delete the entire database file.
 * After this call the DEK is useless even if recovered — data is gone.
 */
export async function wipeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
