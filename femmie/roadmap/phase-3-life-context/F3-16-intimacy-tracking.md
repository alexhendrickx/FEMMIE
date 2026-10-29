# Feature 16 · Sex & Intimacy Tracking (Normalized, Analytical)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, TimescaleDB, PostgreSQL

TASK: Add an analytical layer to existing sex/intimacy logging — libido-over-cycle view and privacy controls.

LOG CATEGORIES: protected/unprotected sex, oral, anal, masturbation, sensual touch,
                orgasm, sex toys, drive level (1–5)

ADDITIONS:
- Libido + activity timeline chart: distribution across cycle phases using user's own data
- Optional fertile-window alert: "You logged unprotected sex in your estimated fertile window"
  (opt-in only; only if user is NOT in TTC mode)
- Private mode: hides this category from any partner view (Feature 19) by default

API:
  GET /insights/intimacy?range=90d → phase-distribution of drive + activity
  PATCH /settings/intimacy { partnerVisible: false, fertileWindowAlert: true }

INCLUSIVE SETUP: onboarding asks partner configuration in neutral language; no assumed gender.

OUTPUT: Fastify routes + RN intimacy timeline chart + privacy settings panel.
CONSTRAINT: Private mode is ON by default. Partner must be explicitly granted access field-by-field.
```
