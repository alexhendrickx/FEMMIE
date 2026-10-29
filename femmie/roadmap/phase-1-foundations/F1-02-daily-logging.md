# Feature 2 · Daily Logging (Smart, Time-Respectful)

```
ROLE: Senior React Native / Expo dev
STACK: React Native, Expo, TypeScript, Fastify API

TASK: Build a smart daily logging flow for a period tracking app.

SPECS:
- Cycle-day-aware category ordering: flow categories hidden outside period window
- User's most-used tags surfaced first; "show all" toggle below
- One-tap shortcuts for frequently logged symptom combos (persist top 3)
- Quick-log entry from home screen (bottom sheet, no date picker)
- Optional bedtime reminder — single local notification, no repeated nudges

DATA CONTRACT:
  POST /logs { date, cycleDay, entries: [{categoryId, value}] }
  GET  /logs/suggestions?cycleDay=N → returns ordered category IDs

OUTPUT: RN bottom-sheet component + Fastify route handlers (TypeScript).
CONSTRAINT: No logging prompt if user already logged today; show "edit today" instead.
```
