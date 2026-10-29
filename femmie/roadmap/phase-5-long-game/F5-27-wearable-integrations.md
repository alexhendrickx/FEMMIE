# Feature 27 · Wearable Integrations (Beyond Apple Watch)

```
ROLE: Senior backend + mobile dev
STACK: Node.js, Fastify, TypeScript, React Native, Expo, PostgreSQL, TimescaleDB, BullMQ

TASK: Build first-party OAuth integrations for 5 wearable platforms feeding into the existing biometric engine.

PLATFORMS: Oura, Garmin Connect, Whoop, Fitbit, Polar

SIGNALS TO READ (where each platform exposes them):
- Body temperature variation (continuous, nightly)
- Sleep stages (deep, REM, light, awake)
- HRV (merge into Feature 9 engine — don't duplicate)
- Recovery / readiness score

ARCHITECTURE:
- Per-platform OAuth service (Fastify plugin per platform)
- Webhook receiver for real-time pushes (Oura, Whoop); polling fallback for others
- Ingest normalizes to shared TimescaleDB schema: { userId, source, signalType, timestamp, value }
- Signal view merges all connected sources; labels source per data point
- Continuous-temperature ovulation detection: flag biphasic temp shift (same logic as BBT in Feature 17)

DISCONNECT HANDLING: if device stops reporting for 5+ days, show "Device not syncing" status — never error, never crash.

OUTPUT: OAuth modules (Oura + 1 other as MVP), webhook receiver, normalization layer, RN device management screen.
CONSTRAINT: Disconnected devices must degrade gracefully — no blank charts, no null crashes.
```
