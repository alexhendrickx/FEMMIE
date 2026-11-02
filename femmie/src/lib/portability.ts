import {
  EXPORT_SCHEMA_VERSION,
  type FemmieExport,
  type ExportInput,
  type ImportResult,
} from '../types/portability';

/**
 * Build / serialize / parse the portable data payload (F5-32).
 *
 * Pure, framework-free. No encryption and no file I/O here — the caller encrypts the
 * serialized string before it leaves the device and decrypts before parseImport. Keeping
 * crypto out of this module keeps it deterministic and unit-testable, and keeps the one
 * encryption boundary in services/encryption.ts (DRY + auditable).
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  if (typeof obj.schemaVersion !== 'number') {
    errors.push('Missing or invalid schemaVersion');
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
      if (!isObject(log) || typeof log.date !== 'string' || !ISO_DATE.test(log.date)) {
        errors.push(`logs[${i}] has a missing/invalid date`);
      } else if (!Array.isArray((log as { entries?: unknown }).entries)) {
        errors.push(`logs[${i}].entries must be an array`);
      }
    });
  }

  for (const key of ['customTags', 'drspEntries', 'painEvents'] as const) {
    if (obj[key] !== undefined && !Array.isArray(obj[key])) {
      errors.push(`${key} must be an array when present`);
    }
  }

  if (obj.settings !== undefined && !isObject(obj.settings)) {
    errors.push('settings must be an object when present');
  }

  return errors;
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
