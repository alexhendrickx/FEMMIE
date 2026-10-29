# Feature 5 · Period Prediction with Confidence Bands

```
ROLE: Senior backend dev
STACK: Node.js, Fastify, TypeScript, TimescaleDB (PostgreSQL)

TASK: Build a period prediction engine that shows honest confidence ranges.

ALGORITHM:
- Collect last N confirmed cycle lengths (min 2, ideal 6+)
- Return predicted window (±stddev), most-likely date, and basis string
- "Low confidence" state when <2 cycles or stddev >5 days

API:
  GET /predictions/next
  Response: {
    windowStart: date, windowEnd: date,
    mostLikely: date, confidence: 'high'|'medium'|'low',
    basis: string  // "Based on your last 6 cycles averaging 28 days, ±2 days"
  }

  GET /predictions/history → [{predicted, actual, delta}] for past 12 cycles

OUTPUT: Fastify route handlers + TimescaleDB query using time-series functions.
CONSTRAINT: Never return a single date without a window. If <2 cycles, return confidence:'low' and no window.
```
