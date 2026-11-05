# Onboarding stepper + copy trim
_Status: spec • 2026-11-05 • Roadmap: none_

## Goal
Replace the onboarding progress dots with a reusable full-width segmented "Step X of 5"
Stepper (the style used in our other apps), move the step label into it, trim verbose copy,
and stop Step 5 from pre-selecting symptoms.

## UI
- Screen(s): `femmie/src/components/Onboarding/*` (OnboardingScreen + Step1–Step5).
- New component `femmie/src/components/common/Stepper.tsx` (RN-only, no feature logic):
  - Props: `total: number`, `current: number` (1-based), `onBack?: () => void`.
  - Top row: back chevron (‹, ≥44px hit area) shown when `onBack` set and `current > 1`;
    label `Step {current} of {total}` in `colors.textMuted`.
  - Segmented bar: flex row of `total` segments (`flex:1`, small gap, rounded); segment `i`
    filled `colors.periodConfirmed` when `i < current`, else `colors.border`. Full screen
    width within padding. Tokens only — no hardcoded hex.
- States: n/a (static per step); back navigates without losing entered date/length (held in
  OnboardingScreen state).
- Reuses: `QuickSymptomPicker` (already enforces MIN via `isValidSelection`), `colors`.
- Navigation: entry unchanged; Stepper replaces the `dots` View in OnboardingScreen.

## Data & privacy
- Model: none — no SQLite/type/schema change.
- Health/PII?: no. Only UI chrome + copy; the already-encrypted daily-log path is untouched.
- Sync: none. Backend: none. Pure logic: none (reuses existing `lib/quickSymptoms`).

## Behaviour & edge cases
- Back on step N>1 → previous step, entered firstDate/cycleLength preserved.
- Step 5 opens with `initial={[]}` → nothing selected → "Start tracking" disabled until the
  existing MIN_QUICK_SYMPTOMS threshold is met (reuse, no new rule).
- Per-step hardcoded labels ("Step 2 of 3", etc.) are deleted; Stepper is the single source.

## Copy (exact English strings)
- Step1: title `Femmie`; subtitle `Private by design.`; promises
  🔑 `Encrypted on your device — only you can read it.` /
  🚫 `No ads, no trackers. We never sell your data.` /
  🗑️ `Delete everything, everywhere, in one tap.`; button `Sounds good →`
- Step2: title `Set up your passkey` / `Welcome back`; body
  `Unlock with Face ID or fingerprint. No password, and your key never leaves this phone.` /
  `Confirm it's you with Face ID or fingerprint.`
- Step3: title `When did your last period start?`; body
  `Helps Femmie predict your next cycle. Skip if you're not sure.`
- Step4: title `How long is your cycle?`; body
  `Days from one period to the next. Most are 24–32 — change it anytime.`
- Step5: title `What do you want to track?`; body
  `Pick a few daily check-ins. They become your one-tap buttons — change them anytime.`

## Out of scope
- All other items from the original ask (moon full-screen sheet, "log in detail" highlight,
  home copy, daily-log rename + empty/logged states, circle→calendar fix, full-screen "You"
  modals, smart/insight push, Apple Health testing) — each a later spec.

## Acceptance criteria (these become tests)
- [ ] `Stepper` renders exactly `total` segments; segments `1..current-1` use the filled
      colour and the rest the unfilled colour (component/prop test).
- [ ] `Stepper` shows the back control only when `onBack` is provided and `current > 1`.
- [ ] `Stepper` label text equals `Step {current} of {total}`.
- [ ] `Step5QuickSymptoms` default selection is empty (no symptom pre-selected).
- [ ] No `Step N of M` string remains hardcoded inside Step1–Step5 components.
- [ ] `cd femmie && npx tsc --noEmit` is clean.
- [ ] HUMAN-VERIFY: run `npx expo start`; each onboarding step fills one more segment, label is
      correct, back preserves entered date/length, Step 5 CTA is disabled until the minimum is
      picked.
