# Feature 22 · Condition-Specific Modes (PCOS, Endometriosis, Adenomyosis)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL

TASK: Add optional condition modes with adapted logging presets, report templates, and curated education.

ONBOARDING QUESTION: "Do you have a diagnosis you'd like the app to support?" (skippable)

CONDITIONS + PRESET FOCUS:
- PCOS: androgen-related symptoms (acne, hirsutism), weight, glucose/energy patterns, cycle irregularity
- Endometriosis: pain mapping (reuse Feature 11), GI symptoms, treatment response, symptom-free windows
- Adenomyosis: heavy bleeding intensity, pelvic pressure, clot tracking, pain type

SHARED ACROSS ALL:
- Condition-specific symptom presets surfaced first in daily log (Feature 2)
- Condition-specific report template (plugs into Feature 23 PDF export)
- Curated education: dated articles from NHS/ACOG/ESHRE — labeled with source + date
- Disclaimer shown once on activation: "This app supports tracking. It does not diagnose or treat."

OUTPUT: conditions table + preset config (JSON-driven), Fastify condition routes, RN condition-mode settings screen.
CONSTRAINT: Education content must display source + publication date. No undated health claims.
```
