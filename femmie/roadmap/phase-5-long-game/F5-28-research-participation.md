# Feature 28 · Opt-In Research Participation

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, PostgreSQL, AWS S3, React Native

TASK: Build an explicit, per-study research program where users opt in with full visibility.

STUDY BROWSER:
- Each study shows: title, institution, data shared, research question, researcher, estimated duration
- User opts in to individual studies independently
- Per-study consent stored with timestamp + study version (re-consent required if scope changes)

DATA EXPORT (per consent):
- Extract only consented fields for that study
- Anonymize: strip userId, replace with random study-participant-id
- Deliver to researcher via secure S3 presigned URL, logged in audit table
- Data is donated — never sold

PARTICIPANT FEEDBACK:
- When study concludes, push summary of findings to opted-in participants
- Public annual report: which studies ran, participant counts, key findings (in-app + web)

API:
  GET  /research/studies
  POST /research/studies/:id/consent       { accepted: true }
  DELETE /research/studies/:id/consent
  GET  /research/my-studies

OUTPUT: Fastify routes + consent table + anonymized export job + RN study browser screen.
CONSTRAINT: Consent must be explicit, per-study. No blanket "opt in to all research" toggle.
```
