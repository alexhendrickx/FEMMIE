# Femmie — Claude Build Roadmap

Each folder below is one phase. Each file is one feature prompt — ready to paste into Claude.

**Tech stack (paste at top of any prompt if needed):**
Mobile: React Native + Expo | Backend: Node.js + Fastify + TypeScript | DB: PostgreSQL + TimescaleDB + Redis | Auth: AWS KMS + libsodium + PASETO | Cloud: AWS ECS Fargate + S3 + CloudFront | Observability: OpenTelemetry + Datadog + Sentry

---

| Phase | Folder | Features | Timeframe |
|-------|--------|----------|-----------|
| 1 — Foundations | `phase-1-foundations/` | F1-01 → F1-06 + AUTH + NAV | Months 0–4 (MVP) |
| 2 — Personal Intelligence | `phase-2-personal-intelligence/` | F2-07 → F2-13 | Months 4–9 |
| 3 — Life Context | `phase-3-life-context/` | F3-14 → F3-20 | Months 9–14 |
| 4 — Medical Depth | `phase-4-medical-depth/` | F4-21 → F4-26 | Months 14–20 |
| 5 — Long Game | `phase-5-long-game/` | F5-27 → F5-34 | Months 20+ |

---

## File index

### Phase 1 — Foundations
- `F1-01-cycle-calendar.md`
- `F1-02-daily-logging.md`
- `F1-03-health-integration.md`
- `F1-04-e2e-encryption.md`
- `F1-AUTH-authentication.md`       ← passkey auth + onboarding gate (prerequisite for F1-05)
- `F1-05-period-prediction.md`
- `F1-06-free-premium-tier.md`
- `F1-NAV-app-shell-navigation.md`  ← final navigation shell (implement after F1-06, before Phase 2)

### Phase 2 — Personal Intelligence
- `F2-07-symptom-correlation.md`
- `F2-08-phase-guidance.md`
- `F2-09-biometric-signals.md`
- `F2-10-mood-tracking.md`
- `F2-11-pain-tracking.md`
- `F2-12-cycle-recap.md`
- `F2-13-custom-symptom-tags.md`

### Phase 3 — Life Context
- `F3-14-training-adaptation.md`
- `F3-15-contraception-tracker.md`
- `F3-16-intimacy-tracking.md`
- `F3-17-ttc-mode.md`
- `F3-18-pregnancy-mode.md`
- `F3-19-partner-view.md`
- `F3-20-timezone-travel.md`

### Phase 4 — Medical Depth
- `F4-21-perimenopause-mode.md`
- `F4-22-condition-modes.md`
- `F4-23-clinical-report-export.md`
- `F4-24-red-flag-detection.md`
- `F4-25-medication-tracker.md`
- `F4-26-ai-companion.md`

### Phase 5 — Long Game
- `F5-27-wearable-integrations.md`
- `F5-28-research-participation.md`
- `F5-29-community-spaces.md`
- `F5-30-accessibility.md`
- `F5-31-multilingual-content.md`
- `F5-32-data-portability.md`
- `F5-33-post-menopause-mode.md`
- `F5-34-trust-infrastructure.md`

---

## How to use

1. Open the file for the feature you're building (e.g. `F2-07-symptom-correlation.md`).
2. Copy the prompt block.
3. Paste into Claude in the `femmie/` project directory for codebase context.

## Prompt structure used in every file

- **ROLE** — 1 line, orients the model
- **STACK** — only the libs relevant to this feature
- **TASK** — single declarative sentence
- **SPECS / API** — bullet lists for structured output
- **OUTPUT** — exact artifacts to produce
- **CONSTRAINT** — the one thing that must not go wrong
