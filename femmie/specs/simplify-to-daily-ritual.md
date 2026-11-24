# Simplify Femmie to a daily ritual

**Date:** 2026-11-14
**Status:** Draft, awaiting approval
**Approach chosen:** A — ritual-only

## Intent and why

Femmie is for women who menstruate and want to understand and regulate their
cycle. The product should feel like Duolingo: a small daily ritual you do in a
few taps, every day, that genuinely helps. Today the app has grown to ~12
screens and four ways to log, which buries that ritual. This work cuts the app
back down to the ritual and the few things that support it.

## Goals

- The daily ritual (`DailyFlow`) is the center of the app: open, a few taps, done.
- A new user reaches her first logged day without configuring anything.
- A first-timer can understand every screen at a glance.
- Fix the two trust defects found during the audit (see Constraints).

## Non-goals

- No new navigation library or router. We reduce screens, not re-architect them.
- No new features. This is a subtraction pass.
- No fertility / trying-to-conceive support. Cut, not hidden.
- No backend or sync-protocol changes. Encrypted sync stays as is.

## Anti-goals (what makes this a failure even if it ships)

- Any health/PII value reaching SQLite, the network, or a log in plaintext.
- Dead code left behind: orphaned stores, components, or imports after a cut.
- Shipping the fake "delete in 7 days" undo that does not exist.

## Constraints

- TypeScript strict; `tsc --noEmit` clean for the app (and backend if touched).
- No new dependencies.
- Colors from `src/theme/colors.ts`; English UI copy.
- Encryption boundary unchanged: the whole store stays encrypted at rest via
  `encryptedStorage` before AsyncStorage.
- Two defects to fix as part of this pass, both trust-critical on a privacy app:
  1. Privacy wipe: "Delete in 7 days" and "Delete now" both wipe instantly; the
     7-day undo is not implemented. Replace with one honest "Delete everything"
     confirm.
  2. Reminder: the UI toggles on/off at a hardcoded 21:30 while the data model
     carries an unused configurable `reminderTime`. Keep a simple on/off and
     remove the dead time plumbing.

## Approaches considered

- **A — ritual-only (chosen).** App = the daily ritual + cycle ring + a simple
  calendar + a small You/settings area. Delete the 38-category detail sheet, the
  clinical mood (DRSP) and pain screens, the custom-tags system, and the
  shortcut-combo layer. Best match for "beautiful, super simple, daily, really
  helps."
- **B — ritual-first, detail tucked away.** Keep a trimmed ~12-category "more"
  sheet one tap from the ritual. Safer, but keeps a second logging surface the
  user has to understand. Rejected: still two ways to log.
- **C — cleanup only.** Fix navigation and the two bugs, merge duplicates, keep
  the surface. Rejected: does not deliver "super simple."

## Decisions

- **Three surfaces total:** (1) Today — cycle ring, outlook card, the ritual;
  (2) Calendar/history — one shared `Agenda` view; (3) You — account, reminder
  on/off, privacy + optional health sync. The 8-item "You" sub-router collapses
  to this.
- **Keep** `DailyFlow` as the ritual: flow (on likely-period days) → mood →
  energy → sleep → a small fixed symptom set → insight recap.
- **Delete** `DailyLogSheet` (38 categories), `Mood/` DRSP screen + `moodStore`,
  `Pain/` screen + `painStore`, `Tags/` CRUD + `tagStore` + text-mining, the
  `ShortcutBar` / `detectShortcuts` combo system, and the **Insights** screen
  (`recap.ts`, the `correlationFeedback` field + setter, the Helpful/Not-relevant
  UI). Remove their stores, types, and imports so nothing is orphaned.
- **Correlation engine partially survives.** `lib/correlation.ts`
  (`surfaceCorrelations`) stays because `lib/dailyFlow.ts: insightOfTheDay()` —
  the kept end-of-ritual insight — depends on it. Only the Insights *screen* and
  its feedback state go.
- **Fertility: cut logging, keep the predicted fertile window.** Drop the
  fertility logging inputs (cervical mucus, BBT, ovulation test, sex, libido)
  from `categories.ts`. Leave the predicted `'fertile'` phase in the ring,
  calendar, and outlook — it belongs to "learn your cycle." Shared type unions
  and `src/health/*` ovulation writes stay untouched.
- **Quick-symptom customization removed fully.** Ship one fixed symptom set.
  Delete the `QuickSymptomPicker`, the Settings "edit daily check-ins" section,
  the `quickSymptomIds`/`setQuickSymptoms` store field + setter, and
  `lib/quickSymptoms`; `DailyFlow` reads a constant.
- **Trim `src/data/categories.ts`** to the ritual's core set: menstrual flow,
  spotting, clots, cramps, headache, bloating, fatigue, mood. Exact shortlist
  left to the builder within this set.
- **Onboarding** drops the "pin 5–8 symptoms" step; ships the fixed set as
  default. Keeps: privacy intro → account → last-period date → cycle length.
- **Health sync** stays as an optional toggle inside You/Privacy, out of the
  daily path. Not deleted — it is real end-to-end-encrypted value.
- **Navigation** stays modal-based; we delete screens rather than add a router.

## Green gate (test runner is now live)

The repo now has `jest` + `jest-expo` wired (`"test": "jest"`), and `tsconfig`
compiles every `src/**/__tests__/*.test.ts`. So "done" = `tsc --noEmit` clean
**and** jest green. Deleting the stores/libs above orphans ~12 test files
(`mood`, `pain`, `moodForm`, `painForm`, `tagsManager`, `customTags`, `logSheet`,
`moodStore`, `painStore`, `tagStore`, `logStore.categories`, `recap`); they are
deleted in the same pass. This is expected, not scope creep.

## Left to the builder

- The exact final symptom shortlist within the core set above.
- UI copy for the simplified wipe confirm and any changed empty states.
- Which files are edited vs deleted outright, listed in the plan before cutting.
