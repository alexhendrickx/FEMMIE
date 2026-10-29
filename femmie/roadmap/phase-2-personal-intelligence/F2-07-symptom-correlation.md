# Feature 7 · Symptom-to-Cycle Correlation Engine

```
ROLE: Senior backend dev
STACK: Node.js, Fastify, TypeScript, TimescaleDB, PostgreSQL

TASK: Build a per-user symptom correlation engine that surfaces phase-distribution patterns.

ALGORITHM:
- For each symptom tag, compute distribution across cycle phases (menstrual/follicular/ovulatory/luteal)
- Use user's own cycle history only (never population averages)
- Only surface patterns present in ≥3 cycles; flag sample size explicitly
- User can mark pattern "helpful" or "not relevant" (persisted, filters future surfaces)

API:
  GET /insights/correlations
  Response: [{
    symptomId, symptomName,
    pattern: string,           // "Your migraines cluster 1–2 days before period in 6/8 cycles"
    phaseDistribution: {...},
    cyclesObserved: number,
    confidence: 'sufficient'|'low_sample'
  }]

  POST /insights/correlations/:id/feedback { helpful: boolean }

OUTPUT: Fastify route + TimescaleDB time-bucketing query + feedback table migration.
CONSTRAINT: Return empty array (not an error) when <3 cycles of data exist.
```
