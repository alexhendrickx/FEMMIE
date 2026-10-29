# Feature 14 · Training & Workout Adaptation

```
ROLE: Senior full-stack dev
STACK: Expo HealthKit/Health Connect, TypeScript, Fastify, TimescaleDB, React Native

TASK: Overlay workout data on the cycle and surface personalized training adaptations.

DATA SOURCES:
- HealthKit/Health Connect: workouts (type, duration, heart rate avg/max, perceived exertion)
- Optional OAuth integrations: Strava, Garmin Connect, Whoop (webhooks → ingest service)
- Biometrics from Feature 9 (HRV, RHR)

INSIGHTS:
- Chart heart-rate response + perceived effort by cycle phase using user's own data
- Adaptive suggestion when HRV + cycle phase (late luteal) suggest recovery priority:
  "Your HRV is below your baseline and you're in luteal phase — a lighter session fits your pattern."
- Recovery flag: shown once per relevant day, dismissible

API:
  GET /insights/training?range=90d → workout overlay with cycle phase labels
  GET /insights/training/suggestion → current-day recommendation or null

OUTPUT: Fastify routes + TimescaleDB workout hypertable + RN training overlay chart component.
CONSTRAINT: Suggestions always framed as patterns, never prescriptions. Null if insufficient data.
```
