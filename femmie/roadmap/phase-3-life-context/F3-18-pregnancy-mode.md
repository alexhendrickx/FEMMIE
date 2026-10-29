# Feature 18 · Pregnancy Mode

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL

TASK: Build a pregnancy mode that fully replaces cycle tracking; handles postpartum gracefully.

PREGNANCY HOME (replaces calendar):
- Week-by-week tracking based on LMP or estimated due date
- Symptom tracking calibrated to gestational age (nausea in T1, movements in T2, etc.)
- Kick counter (tap to count; session-based with timestamp log)
- Contraction timer (T3 only; start/stop; shows frequency + duration; "when to call" guidance)

POSTPARTUM MODE:
- Activates after birth date logged
- No period predictions for 6 months (breastfeeding-related irregularity handled)
- Gentle check-in at 6 weeks: "Has your period returned? [Yes / Not yet / Skip]"

LOSS HANDLING:
- Pregnancy loss option in mode settings → non-judgmental flow → returns to cycle mode
- No data deleted; user prompted to choose

OUTPUT: Fastify routes + kick counter component + contraction timer + postpartum state machine.
CONSTRAINT: Never show fertile-window content during pregnancy mode.
```
