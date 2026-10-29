# Feature 15 · Contraception Tracker (Method-Specific Reminders)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL, Expo Notifications

TASK: Build a full contraception tracker with method-specific reminder logic and side-effect tracking.

SUPPORTED METHODS: combined pill, POP (3h window), patch (weekly change), vaginal ring (21+7),
                   copper IUD, hormonal IUD (5yr), implant (3yr)

DATA MODEL:
  contraception_methods { id, userId, type, startDate, settings: jsonb }
  contraception_reminders { id, methodId, dueAt, type: 'dose'|'replace'|'expiry', status }

REMINDER LOGIC (per method):
- Combined pill: daily notification at user-set time (12h grace window)
- POP: strict 3h window warning
- IUD/implant: advance reminders at 3 months, 1 month, 1 week before expiry
- Ring: removal day + reinsertion day reminders

SIDE EFFECTS (reuse Feature 7 correlation engine):
- Before/after view when user switches methods: cycle length, symptoms, mood compared

API:
  GET/POST/PATCH/DELETE /contraception
  GET /contraception/reminders?upcoming=7d

OUTPUT: Fastify routes + migration + reminder scheduler (BullMQ) + RN settings screen.
CONSTRAINT: Medical info copy labeled "Based on [FSRH/ACOG] guidelines, [year]".
```
