# Feature 10 · Mood & Mental-Health Tracking (Careful, PMDD-Aware)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL

TASK: Build careful mood tracking with optional DRSP-style PMDD logging and clinician export.

LOGGING UI:
- Free-form mood note (text, optional)
- Optional structured DRSP prompts (10 items, 1–6 scale) — explicitly framed as "not a diagnosis"
- Shown only if user opts in to "structured mood tracking" in settings

INSIGHTS (reuse Feature 7 correlation engine):
- Surface as: "Your mood drops 3–5 days before your period in 5 of last 6 cycles" (observation only)
- Never frame as diagnosis; never push "optimization"

CLINICIAN EXPORT: PDF with mood timeline + cycle overlay (plugs into Feature 23 PDF service)

SAFEGUARD:
- If DRSP scores are consistently severe (≥4 avg across ≥3 cycles), surface once:
  "These patterns are worth discussing with a doctor. [Generate report]"
- Dismiss remembers indefinitely

OUTPUT: DRSP logging component, mood store (Zustand), Fastify mood endpoints, safeguard logic.
CONSTRAINT: No streaks, no scores, no "you did great" gamification on mood data.
```
