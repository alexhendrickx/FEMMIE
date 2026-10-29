# Home cycle ring + prediction
_Status: spec • 2026-10-29 • Roadmap: femmie/roadmap/phase-1-foundations/F1-05-period-prediction.md (client-side adaptation)_

## Goal
Give Home a glanceable summary above the calendar: a **cycle ring** showing today's
cycle day + phase, and an **honest next-period prediction** (a window + confidence,
never a bare date). All computed on-device from already-logged data — no new storage,
no network. The existing "Log today" button stays.

> **Deviation from roadmap note:** F1-05 frames prediction as a Fastify/TimescaleDB
> backend engine. That conflicts with Femmie's offline-first, E2E-encrypted model (the
> server must never see readable cycle data). This spec implements the F1-05 *algorithm
> and its CONSTRAINT* as **pure client-side logic**; a backend prediction service is
> explicitly out of scope.

## UI
- **Screen:** Home tab in `femmie/App.tsx` — new `<CycleSummary>` rendered **above** the
  existing `<CycleCalendar>`; the calendar and the "Log today" FAB stay unchanged.
- **New components** (`femmie/src/components/CycleRing/`):
  - `CycleRing.tsx` — an SVG ring (use `react-native-svg`, already a dep): grey track +
    a coloured arc for the current phase, centre text = big cycle-day number + small
    phase label.
  - `PredictionLine.tsx` — the text line(s) under the ring.
  - `CycleSummary.tsx` — composes ring + prediction line; this is what App.tsx mounts.
  - `index.ts` — barrel export (mirror `CycleCalendar/index.ts`).
- **States:**
  - **empty** (no period ever logged): neutral grey ring, centre "—" + "No data yet";
    prediction line: `Log your period to see predictions`.
  - **low confidence** (<2 cycles, or cycle-length stddev >5 days): ring shows the cycle
    day/phase; prediction line: `Low confidence — keep logging` (no window shown).
  - **normal:** ring shows cycle day + phase; prediction: `Next period ~ 28 Nov`, sub
    `26–30 Nov`, faint basis `Based on your last 6 cycles · avg 28 days ±2`.
  - **overdue** (today is after the predicted window end): prediction: `Period may be
    late` + the same window, in the muted token (never alarmist).
- **Reuses:** tokens from `src/theme/colors.ts` (`periodConfirmed`, `fertile`, `today`,
  `textMuted`, `surface`, `border`); date helpers `toISO`/`todayISO` from
  `src/components/CycleCalendar/utils.ts`; `useLogStore` for the log data.
- **Navigation:** tapping the ring opens the daily-log sheet (same `setLogOpen(true)` the
  FAB uses) — one more tap target for the primary action, no new route.
- **Copy** (English, exact strings): `No data yet` · `Log your period to see predictions`
  · `Low confidence — keep logging` · `Next period` · `Period may be late` · phase labels
  `Period` / `Follicular` / `Fertile window` / `Luteal`.

## Data & privacy
- **Model:** none new. Period days are **derived** from existing logs: a `DailyLog`
  (`src/types/logging.ts`) whose `entries` contain `{ categoryId: 'menstrual_flow' }`
  (value is a `FlowValue`) counts as a period day. Read from `useLogStore().logs`.
  **Schema/migration change: no. New encrypted field: no.**
- **Health/PII?:** yes — cycle dates are health data, but this feature only *reads*
  already-persisted logs in memory and *derives* numbers. It **writes nothing, sends
  nothing, logs nothing**. No new egress surface.
- **Sync:** none.
- **Backend:** none (see roadmap deviation note).
- **Pure logic:** new framework-free module `src/lib/cycle.ts` (create `src/lib/`; no
  `react-native`/`expo`/SQLite/fetch imports) with:
  - `extractPeriodStarts(logs: DailyLog[]): string[]` — sorted ISO cycle-start dates. A
    day with a `menstrual_flow` entry is a period day; the **first** period day of a run
    is a start, where a run breaks if the gap to the previous period day is `>
    MAX_INTRA_PERIOD_GAP` (2 days) AND a new start additionally requires `>=
    MIN_CYCLE_GAP` (15 days) since the previous start (so a 1-day flow gap mid-period
    doesn't create a phantom cycle).
  - `cycleLengths(starts: string[]): number[]` — day-diffs between consecutive starts.
  - `currentCycleDay(starts: string[], todayISO: string): number | null` — days since the
    last start + 1; `null` if no starts.
  - `cyclePhase(cycleDay: number, avgLength: number): CyclePhase` — `'period'` (days
    1–5), `'fertile'` (≈ avgLength−14 ±2, clamped), `'follicular'` and `'luteal'` for the
    rest.
  - `predictNextPeriod(starts: string[], todayISO: string): Prediction` — implements the
    F1-05 algorithm: needs ≥2 cycles; `mostLikely = lastStart + round(avg)`;
    `window = mostLikely ± round(stddev)` (min ±1 day); `confidence`: `high` (≥6 cycles,
    stddev ≤3), `medium` (≥2 cycles, stddev ≤5), else `low`; `basis` string. **Never a
    date without a window; <2 cycles → `{ confidence: 'low' }` with no window** (the
    CONSTRAINT).
  - All date math **timezone-safe**: parse `'YYYY-MM-DD'` as UTC (e.g. `Date.parse(d +
    'T00:00:00Z')`), diff in whole days — never `new Date(string)` local parsing.
- **New types** (`src/types/cycle.ts`): `type CyclePhase = 'period' | 'follicular' |
  'fertile' | 'luteal'`; `interface Prediction { confidence: 'high' | 'medium' | 'low';
  mostLikely?: string; windowStart?: string; windowEnd?: string; basis: string }`.

## Behaviour & edge cases
_(privacy / correctness first)_
- **No logs at all** → `currentCycleDay` null, `predictNextPeriod` low-confidence no
  window → empty-state UI. Never crashes, never shows a fake day.
- **One cycle only** (<2 lengths) → low confidence, no window (CONSTRAINT).
- **Irregular cycles** (stddev >5) → confidence forced to `low` even with many cycles.
- **Mid-period 1-day flow gap** → must NOT split into two cycles (the `MAX_INTRA_PERIOD_GAP`
  / `MIN_CYCLE_GAP` rule).
- **Overdue** (today past `windowEnd`) → "Period may be late", muted, keeps the window.
- **Timezone / DST** → day counts are stable regardless of device timezone (UTC parsing).
- **No plaintext egress** → the module has no I/O; it must not import SQLite, fetch, or a
  logger. (Pre-existing, out-of-scope note: `logStore` persists via plain AsyncStorage,
  not `services/encryption.ts` — that's F1-04's gap, not introduced here.)

## Out of scope
- Any backend prediction route / TimescaleDB (roadmap deviation).
- Encrypting `logStore`'s AsyncStorage persistence (F1-04).
- Prediction *history* (`GET /predictions/history`) and accuracy tracking.
- Editing the daily-log sheet or the calendar itself.
- Replacing the calendar with the ring (we add above, per the layout decision).

## Acceptance criteria (these become tests)
> ⚠️ The repo has no test runner yet. **Step 0 of the build is to add `jest-expo` + a
> `test` script** (one dependency add — needs approval). Until then these behavioural
> criteria are `HUMAN-VERIFY`; the pure module is still `tsc`-verified for types.

- [ ] `extractPeriodStarts` returns one start per cycle from `menstrual_flow` logs, sorted ascending.
- [ ] A single 1-day gap inside a period does **not** create a second start.
- [ ] `currentCycleDay` returns `null` with no starts, and `daysSinceLastStart + 1` otherwise.
- [ ] `predictNextPeriod` with <2 cycles → `confidence: 'low'`, no `windowStart`/`windowEnd`/`mostLikely`.
- [ ] `predictNextPeriod` with ≥2 regular cycles → `mostLikely` set AND a `windowStart`/`windowEnd` both present (never a date without a window).
- [ ] Cycle-length stddev >5 days forces `confidence: 'low'` regardless of cycle count.
- [ ] Day math is timezone-safe: same inputs give the same cycle day under a faked `TZ=Pacific/Kiritimati` vs `TZ=UTC`.
- [ ] `cyclePhase` maps day 1–5 → `'period'` and the ovulation window → `'fertile'`.
- [ ] HUMAN-VERIFY: on device, Home shows the ring above the calendar; tapping the ring opens the log sheet; empty / low-confidence / normal states render with the correct copy.
