# Femmie — Build Status & Handoff

_Last updated by a cloud build session, 2026-11-02._

This tracks what is **actually built and verified** versus what still needs a device,
cloud infrastructure, or a product decision from you. It is the honest companion to the
aspirational `roadmap/README.md`.

## Green gate (verified this session)

- `cd femmie && npx tsc --noEmit` → clean (TypeScript strict).
- `cd femmie && npx jest` → **69 passing** across 8 suites.
- `backend/` has source but **no `package.json`** — it cannot be type-checked, tested, or
  run yet. (First backend task: add `package.json` + `tsconfig` so it enters the gate.)

## Phase 2 — Personal Intelligence: logic core built on-device ✅

All four were implemented as **framework-free, unit-tested `src/lib/` modules**, not as the
roadmap's "Fastify + TimescaleDB" services. This is deliberate and non-negotiable: the
backend stores **ciphertext only**, so it physically cannot correlate plaintext health
data — doing so would break the product's core promise. The intelligence layer therefore
runs **on-device** against decrypted logs (CLAUDE.md rule 3).

| Feature | Module | What's done | What's left (not cloud-buildable) |
|---|---|---|---|
| **F2-07** correlation engine | `src/lib/correlation.ts` | Per-symptom phase distribution over the user's own history, ≥3-cycle confidence gating, helpful/not-relevant feedback filtering. | UI to surface patterns + persist feedback. |
| **F2-13** custom tags | `src/lib/customTags.ts`, `src/types/customTags.ts` | Validation, duplicate detection, merge + history re-pointing, free-text suggestion mining, correlation label wiring. | **Encrypted** Zustand store + tag-manager UI. |
| **F2-12** cycle recap | `src/lib/recap.ts` | `generateRecap()`: length vs 6-cycle avg, top-3 symptoms, correlation noticings; null below 2 completed cycles. | Push delivery (morning after period) + recap history persistence + RecapCard UI. |
| **F2-08** today's outlook | `src/lib/outlook.ts` | `todayOutlook()`: same-cycle-day (±2d) energy/sleep/mood/pain patterns across ≥3 cycles, non-prescriptive suggestion, neutral placeholder otherwise. | TodayOutlookCard UI + "mute phase content" setting. |

Each shipped on its own branch (`feat/f2-07-…` → `feat/f2-08-…`, stacked), reviewed by the
senior/privacy reviewer, green before commit.

## What CANNOT be finished in a cloud session (needs you)

### Needs a real device + a dev build
- **F2-09** biometric signals, **F3-14** training adaptation, **F5-27** wearables, and all
  HealthKit / Health Connect data flows. These require an iPhone/Android + EAS dev build;
  a cloud container can't exercise them.
- Running the app, screenshots, and "does the reminder actually fire" checks.

### Needs infrastructure you provision
- The **Fastify backend** (no `package.json` yet), PostgreSQL + TimescaleDB, Redis, AWS KMS.
- **F4-26** AI companion (LLM provider + on-device/edge privacy design), **F5-29** community
  spaces (moderation + hosting), **F5-28** research participation (consent + data pipeline).

### Needs a product / content / clinical decision from you
- **F4-24** red-flag detection thresholds (clinical sign-off — liability), **F4-22** condition
  modes (PCOS/endo content), **F3-18** pregnancy / **F3-17** TTC flows, **F5-31** multilingual
  copy, **F4-23** clinical PDF layout.

## Pre-existing observations (not changed this session)

- `src/store/logStore.ts` persists plaintext `DailyLog` objects to **AsyncStorage** via
  zustand `persist`. If AsyncStorage is considered off-device-syncable or backed up, this is
  a candidate privacy gap vs. CLAUDE.md rule 1 ("encrypted before it hits SQLite, the network,
  or a log"). Worth confirming the encryption boundary before more health data flows through
  stores. **This was not touched — flagging only.**

## Recommended next cloud-buildable steps

1. **Wire the backend into the gate**: add `backend/package.json` + `tsconfig.json` so
   `tsc --noEmit` covers it (unblocks the reviewer's "backend if touched" rule).
2. **F2-10 mood** + **F2-11 pain** *logic* (DRSP scoring, pain-event aggregation, body-region
   strings) as `src/lib/` modules reusing the correlation engine — same pattern as above.
3. **F3-20 timezone/travel** date math and **F5-32 data portability** (export/import of the
   full encrypted payload incl. custom tags) — both pure, testable, high-value.
4. The **encrypted stores + UI** for the Phase-2 logic above, once you're at a keyboard with a
   device to test them.
