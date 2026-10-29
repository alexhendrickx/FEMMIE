# Feature 11 · Pain & Migraine Tracking (Intensity + Triggers)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, TimescaleDB, PostgreSQL

TASK: Build detailed pain logging with body map, trigger correlation, and exportable pain log.

LOGGING:
- Interactive SVG body map (front/back) — tap regions to mark pain location
- 0–10 intensity slider, duration picker (minutes to hours), medications tried + effectiveness (1–5)
- Saved as pain_events table: user_id, date, cycle_day, location[], intensity, duration_min, medications[{name, effectiveness}]

INSIGHTS (reuse Feature 7 engine):
- Trigger correlation: "Migraines more likely on days following <6h sleep — seen in 4 of your last 6 occurrences"
- Phase correlation: pain distribution across cycle phases

EXPORT: formatted PDF for gynecology/neurology appointment (plugs into Feature 23 PDF service)
  Includes: timeline chart, top locations, avg intensity by cycle phase, medications tried

OUTPUT: RN body map SVG component, pain logging form, Fastify CRUD routes, TimescaleDB hypertable.
CONSTRAINT: Body map stores location as named region strings, not pixel coords (for portability).
```
