import type { DailyLog } from './logging';
import type { CustomTag } from './customTags';
import type { DrspEntry } from './mood';
import type { PainEvent } from './pain';

/**
 * Data portability payload (Feature F5-32).
 *
 * This is the user's OWN data, decrypted, so they can take it with them (GDPR-style
 * portability). The export file itself should be encrypted / password-protected by the
 * caller before it leaves the device — this module only defines the shape and does the
 * shape validation; it performs no crypto and no I/O.
 */
export const EXPORT_SCHEMA_VERSION = 1;

export interface FemmieExport {
  schemaVersion: number;
  exportedAt: string; // ISO timestamp
  logs: DailyLog[];
  /** Custom tags MUST survive export/restore (F2-13 constraint). */
  customTags: CustomTag[];
  drspEntries: DrspEntry[];
  painEvents: PainEvent[];
  settings: Record<string, unknown>;
}

/** The caller-supplied slice of app state that an export is built from. */
export interface ExportInput {
  logs: DailyLog[];
  customTags?: CustomTag[];
  drspEntries?: DrspEntry[];
  painEvents?: PainEvent[];
  settings?: Record<string, unknown>;
}

export type ImportResult =
  | { ok: true; data: FemmieExport }
  | { ok: false; errors: string[] };
