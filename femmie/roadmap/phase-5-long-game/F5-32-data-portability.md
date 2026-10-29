# Feature 32 · Data Portability & Graceful Exit

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, PostgreSQL, TimescaleDB, AWS S3, React Native

TASK: Full data export in standard formats + honest account deletion with no dark patterns.

EXPORT (one-tap, no premium gate):
- JSON: complete user data (cycles, logs, symptoms, medications, settings, correlations)
- CSV: cycle summary table + symptom log table (one row per day)
- FHIR R4 bundle (same as Feature 23)
- Generated async → S3 → signed URL via push notification + in-app link

ACCOUNT DELETION:
- Settings → Delete Account → single confirmation screen (no "are you sure" loops)
- Hard delete: all personal data removed within 24h (async BullMQ job)
- Confirmation email sent when deletion is complete
- 7-day recoverable grace period only if user explicitly requests it (default: immediate)

RE-IMPORT:
- Import from exported JSON: restore cycle history + symptom log into new account

API:
  POST /account/export           → { jobId }
  GET  /account/export/:jobId    → { status, downloadUrl? }
  DELETE /account               { gracePeriod: boolean }

OUTPUT: export job + deletion job (BullMQ) + Fastify routes + RN export/delete screens.
CONSTRAINT: No win-back offers during deletion flow. Deletion confirmation screen is informational only.
```
