# Feature 12 · Cycle Recap — Monthly Review Card

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, TimescaleDB, React Native, Expo

TASK: Generate a Cycle Recap card delivered the morning after a period starts.

CONTENT (auto-generated per user):
1. Cycle length + period length vs. 6-cycle average
2. Top 3 symptoms by frequency and by phase
3. 1–2 "noticings" from the correlation engine (Feature 7)
4. One HRV/sleep signal observation if data available (Feature 9)

DELIVERY:
- Push notification morning after period start logged
- Recap persists in-app as scrollable history of past recaps

API:
  GET  /recaps?limit=12           → list of past recaps
  GET  /recaps/:cycleId           → single recap detail
  POST /recaps/generate (internal, triggered by period-start event)

OUTPUT: Recap generator service (pure TS function), Fastify routes, RN RecapCard component.
CONSTRAINT: Generate only when ≥2 complete cycle data points exist. Never show empty/placeholder insights.
```
