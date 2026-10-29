# Feature 17 · Trying to Conceive (TTC) Mode

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL, TimescaleDB

TASK: Build a TTC mode reorganized around ovulation precision, BBT, and LH logging.

TTC HOME SCREEN (replaces standard calendar home):
- Ovulation prediction front and center (confidence window, not single date)
- BBT chart (sawtooth, biphasic shift detection at +0.2°C sustained ≥3 days)
- LH test result logging: negative / low-positive / peak positive + optional photo (stored encrypted, S3)
- Intercourse timing suggestions (gentle, one per day max, opt-in)

ADDITIONAL:
- Evidence-based timeline: "If you've been trying for >12 months (>6 months if >35), consider a specialist"
- Partner share: intercourse timing only, if partner view enabled (Feature 19)

API:
  GET  /ttc/dashboard        → BBT chart data + ovulation prediction + LH log
  POST /ttc/bbt              { date, temp, unit: 'C'|'F', time, notes }
  POST /ttc/lh-test          { date, result: 'negative'|'low'|'peak', photoKey? }

OUTPUT: Fastify routes + TimescaleDB BBT hypertable + RN BBT chart + TTC dashboard screen.
CONSTRAINT: Copy throughout is compassionate, never gamified. No streaks, no "you missed a day".
```
