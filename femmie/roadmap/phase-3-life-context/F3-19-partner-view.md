# Feature 19 · Partner View (User-Controlled Sharing)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL, AWS KMS

TASK: Build granular partner sharing where the user controls every field individually.

SHAREABLE FIELDS (each toggled independently):
- Next predicted period window
- Current cycle phase
- Mood pattern summary ("She typically feels low in the next few days")
- Fertile window (only if TTC mode active and user enables)
- Custom message / note

PARTNER FLOW:
- Invite by code (6-char, 48h expiry); partner installs app, enters code
- Partner sees curated summary only — never raw logs
- User can revoke in one tap; partner loses access immediately

PARTNER NOTIFICATIONS (optional, user-controlled, off by default):
- "Gentle prompt" to partner: "She's entering a phase where small gestures help" (once per phase)

API:
  GET  /partner/share-config
  PATCH /partner/share-config       { fields: { periodDate: bool, phase: bool, ... } }
  POST /partner/invite              → { code, expiresAt }
  DELETE /partner/connection

OUTPUT: Fastify routes + partner invite flow + partner summary screen + sharing settings screen.
CONSTRAINT: Partner reads a computed summary, never raw database records.
```
