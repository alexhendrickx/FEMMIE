# Feature 13 · Personal Symptom Dictionary (Custom Tags)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL

TASK: Let users create custom symptom tags that are fully indexed by the correlation engine.

CUSTOM TAG SCHEMA:
  { id, userId, name, color, icon (emoji), scaleType: 'binary'|'1-5'|'free_text', createdAt }

FEATURES:
- Create/edit/delete custom tags; duplicates warned ("Looks like you have 'low energy' — merge?")
- Correlation engine (Feature 7) treats custom tags identically to built-in tags
- Suggest tags from free-text notes: keyword extraction → "You've written 'brain fog' 8 times — add as a tag?"

API:
  GET/POST/PATCH/DELETE /tags/custom
  GET /tags/suggestions        → from free-text note keyword analysis
  POST /tags/merge { keepId, discardId }

OUTPUT: Fastify routes + PostgreSQL migration + RN tag management screen.
CONSTRAINT: Custom tags must survive account restore/export (included in data export payload).
```
