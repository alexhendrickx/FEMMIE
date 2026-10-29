# Feature 3 · Native Health Integration (Two-Way, Transparent)

```
ROLE: Senior React Native / Expo dev
STACK: Expo HealthKit (iOS) + Health Connect (Android), TypeScript

TASK: Build a transparent, two-way Health app integration screen.

SPECS:
READ from Health: sleep, HRV, resting heart rate, weight, workouts
WRITE to Health: cycle events, period flow, ovulation, sexual activity

UI — dedicated settings screen shows:
- Each data type, sync direction icon, last-sync timestamp
- Toggle to pause any individual stream
- Scrollable audit log: last 30 sync events (date, type, direction, status)

OUTPUT: Expo module wrapper + settings screen component + sync-status store (Zustand).
CONSTRAINT: Handle permission-denied gracefully; never crash on missing HealthKit entitlement.
```
