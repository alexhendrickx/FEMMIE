# Feature 25 · Medication Interaction Awareness

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL, TimescaleDB

TASK: Optional medication tracker that shows before/after cycle impact — conservative, observation-only.

MEDICATION LOG:
  medications { id, userId, name, dose, frequency, startDate, stopDate? }

BEFORE/AFTER VIEW:
- Compare cycle length, symptom frequency, mood in 3 months before vs. 3 months after start date
- Copy: "You started [medication] on [date]. Since then, your cycles have averaged X days [shorter/longer].
         This may or may not be related — worth raising with your doctor."

SCOPE (conservative):
- No drug database lookups; no interaction warnings
- Only pattern observation from user's own data
- User supplies medication name as free text (no autocomplete to avoid liability)

API:
  GET/POST/PATCH/DELETE /medications
  GET /medications/:id/cycle-impact → before/after comparison object

OUTPUT: Fastify CRUD + cycle-impact comparison query (TimescaleDB window functions) + RN medication screen.
CONSTRAINT: No causation claims. No drug recommendations. Pattern observation only, always.
```
