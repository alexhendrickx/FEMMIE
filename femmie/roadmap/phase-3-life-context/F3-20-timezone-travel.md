# Feature 20 · Travel & Timezone Handling

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, PostgreSQL, React Native, Expo

TASK: Make cycle tracking and pill reminders timezone-safe across international travel.

DATA MODEL:
- All timestamps stored as UTC + local timezone string at time of logging (e.g., "Europe/Amsterdam")
- Cycle math computed in UTC; displayed in current device timezone
- Log entry: { utcTimestamp, localTimezone, localDate }

PILL REMINDER RECALCULATION:
- On timezone change detection (device timezone differs from last logged):
  Offer "adjust reminders to new timezone?" → recalculate next reminder in new TZ
- POP 3h window: show adjusted local time explicitly

TRAVEL MODE toggle in settings:
- Suppresses jetlag-spike biometrics from cycle insight calculations for 48h post-travel

OUTPUT: timezone-aware logging middleware (Fastify), reminder recalculation service, RN timezone-change alert.
CONSTRAINT: Never compute cycle day using local-date arithmetic alone — always anchor to UTC. Test explicitly across DST transitions.
```
