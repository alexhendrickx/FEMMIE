import {
  EXPORT_SCHEMA_VERSION,
  type FemmieExport,
  type ExportInput,
  type ImportResult,
} from '../types/portability';
import { isIsoDate } from './cycle';
import { isValidDrspEntry } from './mood';
import { isValidPainEvent } from './pain';
import type { DrspEntry } from '../types/mood';
import type { PainEvent } from '../types/pain';

/**
 * Build / serialize / parse the portable data payload (F5-32).
 *
 * Pure, framework-free. No encryption and no file I/O here — the caller encrypts the
 * serialized string before it leaves the device and decrypts before parseImport. Keeping
 * crypto out of this module keeps it deterministic and unit-testable, and keeps the one
 * encryption boundary in services/encryption.ts (DRY + auditable).
 */

/** Assemble a complete export payload, stamping the schema version + timestamp. */
export function buildExport(input: ExportInput, now: Date = new Date()): FemmieExport {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    logs: input.logs,
    customTags: input.customTags ?? [],
    drspEntries: input.drspEntries ?? [],
    painEvents: input.painEvents ?? [],
    settings: input.settings ?? {},
  };
}

export function serializeExport(exp: FemmieExport): string {
  return JSON.stringify(exp);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validate a parsed object against the export schema; returns a list of problems. */
export function validateExport(obj: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(obj)) return ['Export is not an object'];

  if (typeof obj.schemaVersion !== 'number' || !Number.isInteger(obj.schemaVersion) || obj.schemaVersion < 1) {
    errors.push('Missing or invalid schemaVersion (must be a positive integer)');
  } else if (obj.schemaVersion > EXPORT_SCHEMA_VERSION) {
    errors.push(
      `Export schema v${obj.schemaVersion} is newer than this app supports (v${EXPORT_SCHEMA_VERSION}) — update the app to import it`,
    );
  }

  if (typeof obj.exportedAt !== 'string' || Number.isNaN(Date.parse(obj.exportedAt))) {
    errors.push('Missing or invalid exportedAt');
  }

  if (!Array.isArray(obj.logs)) {
    errors.push('logs must be an array');
  } else {
    obj.logs.forEach((log, i) => {
      if (!isObject(log) || !isIsoDate(log.date)) {
        errors.push(`logs[${i}] has a missing/invalid date`);
        return;
      }
      if (!Array.isArray(log.entries)) errors.push(`logs[${i}].entries must be an array`);
      if (typeof log.cycleDay !== 'number') errors.push(`logs[${i}].cycleDay must be a number`);
      if (typeof log.savedAt !== 'string') errors.push(`logs[${i}].savedAt must be a string`);
    });
  }

  // Nested health records are validated with their own validators so a corrupt entry
  // is rejected at import rather than silently restored.
  validateArraySection(obj.drspEntries, 'drspEntries', (e) => isValidDrspEntry(e as DrspEntry), errors);
  validateArraySection(obj.painEvents, 'painEvents', (e) => isValidPainEvent(e as PainEvent), errors);

  if (obj.customTags !== undefined && !Array.isArray(obj.customTags)) {
    errors.push('customTags must be an array when present');
  }

  if (obj.settings !== undefined && !isObject(obj.settings)) {
    errors.push('settings must be an object when present');
  }

  return errors;
}

function validateArraySection(
  value: unknown,
  key: string,
  isValidElement: (e: unknown) => boolean,
  errors: string[],
): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(`${key} must be an array when present`);
    return;
  }
  value.forEach((el, i) => {
    if (!isObject(el) || !isValidElement(el)) errors.push(`${key}[${i}] is invalid`);
  });
}

/**
 * Parse a serialized export string, validate it, and normalize optional sections to
 * empty defaults so the result is always a complete FemmieExport. Never throws — a bad
 * payload comes back as `{ ok: false, errors }`.
 */
export function parseImport(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, errors: ['Not valid JSON'] };
  }

  const errors = validateExport(parsed);
  if (errors.length > 0) return { ok: false, errors };

  const obj = parsed as Record<string, unknown>;
  const data: FemmieExport = {
    schemaVersion: obj.schemaVersion as number,
    exportedAt: obj.exportedAt as string,
    logs: obj.logs as FemmieExport['logs'],
    customTags: (obj.customTags as FemmieExport['customTags']) ?? [],
    drspEntries: (obj.drspEntries as FemmieExport['drspEntries']) ?? [],
    painEvents: (obj.painEvents as FemmieExport['painEvents']) ?? [],
    settings: (obj.settings as FemmieExport['settings']) ?? {},
  };
  return { ok: true, data };
}
