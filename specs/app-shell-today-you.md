# App shell — Today / You
_Status: spec • 2026-11-01 • Roadmap: femmie/roadmap/phase-1-foundations/F1-06-NAV-app-shell-navigation.md (SUPERSEDED — see note)_

## Context
`App.tsx` still renders the prototype **3-tab bottom bar** (Home / Health / Privacy).
Six UX rounds (`specs/ux-decisions.md`, decisions #7–#9) reframed the app to **two
destinations, no tab bar**: a focused **Today** screen with a profile avatar (top-right)
that opens a **"You"** panel containing History + Health + Privacy + Settings. This is
the "walking skeleton" every later feature (daily swipe-flow, 2-step onboarding,
Week/Month/List history) will hang off. The old roadmap `F1-06-NAV` (React Navigation v7
+ 4-tab bottom bar) is **superseded** by those UX decisions and is NOT the target.

## Goal
Replace the demo tab-shell in `App.tsx` with the final **Today / You** structure: one
Today screen (ring + "upcoming in N days" + a button that opens today's logging) and a
full-screen **You** sheet (opened from a top-right avatar) that reuses the existing
Health and Privacy screens, plus History and a new small Settings screen. Move existing
functionality; delete nothing.

## UI
- **Navigation approach (DECIDED):** hand-rolled `useState` + React Native `<Modal>` —
  **no new dependency** (keeps the pattern `App.tsx` already uses; React Navigation is
  explicitly *not* added for 2 destinations).
- **Today screen** (default view, replaces `tab === 'home'`):
  - `CycleSummary` (reused) centered — it already derives the ring + "upcoming in N days"
    from `logStore`/`lib/cycle`. Per UX decision #18 it shows **only** the big number +
    "upcoming in N days", **no advice card** — CycleSummary already does this, leave it.
  - **Avatar button, top-right** → opens the You sheet. Label/`accessibilityLabel`
    "Open profile". Simple circular touch target (emoji 🌙 or initial for now).
  - **Primary button** (reuse current FAB wiring): opens the existing `DailyLogSheet`.
    Copy morphs on `useLogStore().hasLoggedToday()`: "＋  Start today" → "✏️  Edit today".
    (Real Duolingo swipe-flow is a later feature; DailyLogSheet is the placeholder.)
  - **No `CycleCalendar` on Today** — it moves to History inside You.
  - **No bottom tab bar.**
- **You sheet** — full-screen `<Modal>` (`presentationStyle` slide-up), its own internal
  view state `'list' | 'history' | 'health' | 'privacy' | 'settings'`:
  - Header: title **"You"** + **×** close (returns to Today). Sub-views show a **‹ Back**
    affordance returning to `'list'`.
  - List rows (tappable, chevron `›`), reusing existing screens unchanged:
    - 📅 **History** → `CycleCalendar` (reused; Week/Month/List toggle is a later feature).
    - ❤️ **Health** → `HealthIntegrationScreen` (reused as-is).
    - 🔒 **Privacy** → `PrivacyScreen` (reused as-is).
    - ⚙️ **Settings** → new `SettingsScreen` (below).
- **New `src/components/You/`** holding: `YouSheet.tsx` (modal + list + sub-view router),
  `SettingsScreen.tsx`, `index.ts`. English copy throughout; tokens from
  `src/theme/colors.ts` (no hardcoded hex); comfortable touch targets.
- **SettingsScreen** (new, small):
  - Account line: "Signed in with a passkey" when `useAuth().hasPasskey`, else a neutral
    line; show an offline hint when `useAuth().isOffline`.
  - **Log out** button → calls existing `useAuth().logout()` (do NOT hand-roll token
    clearing). After logout the existing `AppGate` returns to onboarding automatically.
  - A disabled/"coming soon" **Notifications** row placeholder (no logic yet).
- **States:** Today empty (no logs) = CycleSummary's existing no-data state, button reads
  "Start today". You = static list, no loading. Settings logout = fire `logout()`, let
  AppGate re-render (no custom spinner needed).

## Data & privacy
- **Model:** none. No new SQLite table/column, no new type, **no migration**. Pure
  UI/navigation reorganization.
- **Health/PII?:** The shell itself captures/stores **no** health data. It only re-mounts
  existing screens. `SettingsScreen` must display **no plaintext health data and no
  secrets** — no PASETO token, no key material, no raw identifiers on screen.
- **Sync:** none (no network calls added).
- **Backend:** none.
- **Pure logic:** none new — ring/prediction logic already lives in `src/lib/cycle.ts` via
  `CycleSummary`.

## Behaviour & edge cases
- **Logout while offline** → `useAuth().logout()` already handles it; UI returns to
  onboarding via `AppGate`. No crash, no half-state.
- **You open ↔ DailyLogSheet** → only one overlay at a time; opening You does not open the
  log sheet and vice-versa (independent state flags).
- **Back / close** → × on You and ‹ Back on a sub-view never leave the user on a blank
  screen; closing You always lands back on Today.
- **No plaintext leak** → Settings renders only `hasPasskey`/`isOffline` booleans and
  static copy; assert no token/key/health string is rendered.
- **Unauthenticated** → unreachable; `AppGate` still gates the whole shell behind auth +
  onboarding (unchanged).

## Out of scope (separate later features)
- The Duolingo-style **daily swipe-flow** (mood → flow → top-5 → insight).
- **2-step onboarding** (date → cycle-length).
- History **Week/Month/List** segmented control; replacing `DEMO_DAYS` with real
  log-derived `DayData` in the calendar.
- Deep links (`femmie://…`), notifications wiring, account editing beyond logout.

## Acceptance criteria (these become tests / type guarantees)
- [ ] `App.tsx` no longer renders a bottom tab bar or the `Tab`/`TABS` prototype; the
      default view is the Today screen.
- [ ] Today renders `CycleSummary` and a top-right avatar button whose press opens the
      You sheet (state toggles, modal `visible` true).
- [ ] Today's primary button opens the existing `DailyLogSheet`; its label reflects
      `hasLoggedToday()` ("Start today" vs "Edit today").
- [ ] `CycleCalendar` is NOT rendered on Today; it is rendered under You → History.
- [ ] You sheet exposes exactly four rows — History, Health, Privacy, Settings — each
      rendering the corresponding existing component (`CycleCalendar`,
      `HealthIntegrationScreen`, `PrivacyScreen`) or the new `SettingsScreen`.
- [ ] `SettingsScreen`'s Log out button invokes `useAuth().logout`; no bespoke token
      clearing is added.
- [ ] `SettingsScreen` renders no token, key, or health-data string (privacy guard).
- [ ] New code lives in `src/components/You/` and reuses existing screens — no screen is
      duplicated or deleted; no new npm dependency is added.
- [ ] `npx tsc --noEmit` is clean (app); navigation state is typed (no `any`).
- [ ] HUMAN-VERIFY: on device/simulator, open app → Today shows ring + "upcoming in N
      days"; tap avatar → You opens; open each of History/Health/Privacy/Settings and
      back out; tap Log out → returns to onboarding.

## Verification
- `cd femmie && npx tsc --noEmit` — green.
- `cd femmie && npx expo start` → run iOS/Android, walk the HUMAN-VERIFY steps above.
- (Tests gate once a runner exists; until then type-check + the HUMAN-VERIFY walk is the
  green gate, per CLAUDE.md.)
