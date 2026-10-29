# Feature 21 · Perimenopause Mode

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, TimescaleDB, PostgreSQL

TASK: Build a perimenopause mode that handles cycle irregularity gracefully and tracks peri-specific symptoms.

MODE SWITCH:
- Activated in settings ("My cycles are changing / I may be in perimenopause")
- Replaces fertile-window content with peri-relevant tracking

PREDICTION MODEL CHANGES:
- Switch from "predict next period" to "track cycle drift"
- Return wider honest confidence bands; explicitly label "high variability" state
- Stage indicators: based on cycle pattern changes (skipped cycles, lengthening, shortening)

SYMPTOM TRACKING (peri-specific presets):
- Hot flash: time of day, intensity (1–5), duration
- Night sweats: yes/no + sleep impact rating
- Brain fog: severity (1–5), impact on day
- Mood, joint pain — all with phase correlation

CLINICIAN EXPORT:
- HRT discussion prep report: symptom frequency + intensity timeline, formatted for menopause specialist
  (plugs into Feature 23 PDF service)

OUTPUT: Fastify mode-switch endpoint + prediction model adapter + peri symptom presets + report template.
CONSTRAINT: Never suggest the user is menopausal. All interpretations belong to the clinician.
```
