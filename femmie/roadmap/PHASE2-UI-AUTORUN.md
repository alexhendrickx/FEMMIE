# Autonomous run prompt — Phase-2 UI (paste into a Claude cloud session)

You are the orchestrator for the **Femmie** app (privacy-first, end-to-end-encrypted
period tracker; React Native + Expo in `femmie/`). Read `femmie/CLAUDE.md` and
`femmie/roadmap/BUILD-STATUS.md` first. Your job is to build the remaining **Phase-2
UI** features, one feature per branch, and keep running until all four are green +
reviewed — WITHOUT asking me anything unless you hit a true product decision.

## Token discipline (important)
Do the thinking light and push the heavy work into subagents so YOUR context stays
small. For EACH feature run this pipeline and keep only the short summaries each agent
returns — never read full file dumps into your own context:
1. `planner` agent → writes a file-level plan to `.claude/state/plans/<feature>.md`.
2. `executor` agent → implements exactly that plan. Return a terse diff summary only.
3. `checker` agent → runs `cd femmie && npx tsc --noEmit` and `npx jest`; returns
   PASS/FAIL + failures only. If FAIL, hand the report back to `executor` and loop
   (max 3 repair cycles per feature).
4. `reviewer` agent → senior/privacy review; must clear privacy, reuse, test coverage.
   Fix blocking findings via `executor`, then re-check.
Prefer the `/build-loop <feature>` skill if available — it already wires this loop.

## Build order (one session/branch each, in this order)
Logic for all four already exists and is unit-tested in `femmie/src/lib/`. You are only
adding UI + encrypted persistence on top. Reuse existing components/stores; add nothing
new if an existing one can be extended.
1. **F2-08 Today's Outlook card** — surface `src/lib/outlook.ts` `todayOutlook()` on the
   Today screen; non-prescriptive note; neutral placeholder below 3 cycles. Add a
   "mute phase content" setting in You → Settings.
2. **F2-11 Pain tracking UI** — logging form (body region + intensity + medication) wired
   to `src/lib/pain.ts`; show top locations / avg-by-phase in History. Use a simple
   region LIST (not an SVG body map) unless I say otherwise.
3. **F2-10 DRSP mood UI** — opt-in 10-item DRSP form + PMDD-aware safeguard surfacing,
   on top of `src/lib/mood.ts`. No gamification.
4. **F2-13 Custom tags UI** — tag-manager (create/merge/rename) over `src/lib/customTags.ts`
   + free-text suggestion mining in the daily log flow.

## Non-negotiable rules
- **Privacy first:** any new health/PII persistence MUST go through the encrypted path
  (`src/services/encryption.ts` / the `encryptedStorage` zustand adapter in
  `src/services/secureStorage.ts`). NEVER persist/log plaintext health data. If a feature
  needs a new store, use `createJSONStorage(() => encryptedStorage)`, never raw AsyncStorage.
- **Pure logic stays in `src/lib/`** (no react-native/expo/sqlite imports there).
- Design tokens from `src/theme/colors.ts` (no hardcoded hex). English UI copy. No
  AI-slop phrasing (no "seamless/effortless/unlock/journey", no emoji spam). Mobile-first.
- **Definition of done per feature:** `tsc --noEmit` clean AND `npx jest` green (currently
  162 tests — never let it drop) AND reviewer passes. Add tests for any new `src/lib/` logic.

## Git workflow (follow femmie/CLAUDE.md + global)
- Branch per feature off `main`: `feat/f2-08-today-outlook`, etc. Current `main` already
  has the privacy fix merged? If not, note that `fix/encrypt-daily-log-at-rest` (commit
  8651d8f) is the prerequisite and branch your work on top of it.
- Commit when green, scoped to the one feature, English messages, Co-Authored-By trailer.
- **DO NOT `git push`.** When each feature is green + reviewed, commit locally and append a
  one-line status to `femmie/roadmap/BUILD-STATUS.md`, then move to the next feature.
- After ALL four are done, STOP and post: the branch list, the per-feature test counts,
  and the exact `git push` / `gh pr create` commands for me to run myself.

## Only ask me if
you hit a real product/clinical/content decision not covered above (e.g. DRSP clinical
copy, PMDD threshold wording). Otherwise pick the sensible default, note it, and keep going.

Begin with F2-08. Keep running until all four are complete.
