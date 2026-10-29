# Feature 9 · Sleep, HRV & Energy as Cycle Signals

```
ROLE: Senior full-stack dev
STACK: Expo HealthKit/Health Connect, TypeScript, TimescaleDB, Fastify

TASK: Overlay wearable biometric signals onto the cycle and surface anomalies vs. user baseline.

SIGNALS: sleep duration, HRV, resting heart rate (RHR), step count
SOURCE: HealthKit / Health Connect (already synced via Feature 3)

BACKEND:
- Store biometrics in TimescaleDB hypertable (user_id, timestamp, signal_type, value)
- Baseline = rolling 90-day percentile per signal per user
- Anomaly = value outside 1 stddev from baseline, flag with cycle day
- Physiological prediction improvement: correlate HRV/RHR drops with actual period starts

API:
  GET /insights/signals?range=30d
  Response: { days: [{ date, cycleDay, sleep, hrv, rhr, steps, anomalies: string[] }] }

UI: Multi-line cycle chart (Victory Native); toggle per signal; clear legend distinguishing reported vs sensor data.

OUTPUT: TimescaleDB schema, Fastify route, RN chart component.
CONSTRAINT: Label sensor data vs. self-reported data visually — never merge without distinction.
```
