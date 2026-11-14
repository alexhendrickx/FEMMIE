# Claude agent system — research → plan → execute → check → review, until the goal is met

A spec-driven pipeline of **isolated** subagents. Each role runs on the cheapest model
that does it well: Fable 5 for the hard thinking, Opus 4.8 for judging, Sonnet 5 for the
labor, Haiku for mechanical checks. That keeps your usage limit stretching across many
more pipeline runs, and the independent gates mean nobody marks their own work. Ported
from the Factuurt/Datewatch orchestration system
and adapted to **Femmie's** stack (React Native + Expo app, Fastify backend) and its
one non-negotiable: **this is a privacy-first, end-to-end-encrypted health app — a data
leak is the end of the product, so privacy is the review's crown jewel.**

Project conventions the agents rely on (layout, the privacy rules, the gate commands,
the test-runner gap) live in the root `CLAUDE.md` — keep that current or every agent
plans against stale assumptions.

## The model split

| Agent | Model | Effort | Role |
|------|------|------|------|
| `researcher` | **Sonnet 5** | medium | Read-only. Gathers codebase/web context before planning. Optional. |
| `planner` | **Fable 5** | xhigh | Turns the task/spec into a file-level plan, rates it `routine` or `hard`. Writes a plan doc, no source. |
| `executor` | **Sonnet 5**, or **Fable 5** | high | Implements the plan **and its tests**, literally. Fable 5 when the plan is `hard` or after two failed cycles. |
| `checker` | **Haiku** | low | Read-only. Runs `tsc --noEmit` (+ tests when a runner exists), reports compact pass/fail/regressions. |
| `reviewer` | **Opus 4.8** | high | Read-only senior gate: **privacy/encryption first**, then reuse, coverage. Runs after green. |
| `goal-checker` | **Opus 4.8** | high | Read-only. Independent judge of whether your success criteria are met. |

**Routing rule.** Spend Fable 5 where a wrong decision is expensive: the plan, and any
build Sonnet couldn't land in two tries. Spend Opus 4.8 on judgement, where a missed
privacy hole or an early "done" costs the most. Everything else (reading, typing,
running commands) runs on Sonnet 5 or Haiku. The orchestrator passes the model per
launch through the Agent tool's `model` parameter, which beats the `model:` line in the
agent file. Each agent also has a `maxTurns` cap (researcher 40, planner 50, executor
80, checker 20, reviewer 50, goal-checker 30) so one stuck run can't burn the quota.

**Why the planner decides.** `COMPLEXITY: hard` means the change handles health or
personal data, touches encryption, secure storage, auth, or sync, changes the schema or
adds a migration, spans 8 or more files, or has no pattern to copy. The planner is the
strongest model and has read the code, so it makes the call instead of the orchestrator
guessing. A missing rating counts as `hard`.

## The commands

```
/plan  <idea>       → interviews you, writes specs/<feature>.md  (design before coding)
/build-loop <task>  → one feature, driven to green + reviewed     (research→plan→execute→check→review)
/goal  <criteria>   → keeps running /build-loop until an independent judge says the criteria are MET
```

### Which entry point when
- **Non-trivial feature, you're at the keyboard:** `/plan` → `/build-loop`. A
  `femmie/roadmap/**/F*.md` file counts as a starting spec — `/plan` refines it, or feed
  it straight to `/build-loop` when it's already precise.
- **Small, unambiguous change:** `/build-loop` directly.
- **Multi-feature outcome, or you're walking away:** `/goal` (optionally under `/loop`
  or `/schedule`). Criteria must be repo-checkable — "the reminder fires on my phone"
  needs a human, not the goal-checker.
- **Not a change at all** (a question, a one-line tweak): just ask normally. The
  pipeline's floor cost is ~4 subagent runs.

### Typical flow
```
/plan next-period prediction banner on Home
# answer the questions → specs/period-prediction-banner.md
/build-loop implement specs/period-prediction-banner.md
```

### Hands-off flow
```
/goal the next-period banner shows a predicted date, never a past date, is unit-tested, and passes review
```
- **Local (laptop open):** `/loop 30m /goal <criteria>`.
- **Cloud (laptop closed):** `/schedule` it (e.g. hourly).

## The pipeline

```
Phase 0  researcher (opt) ─▶ planner ─▶ .claude/state/plans/<feature>.md
Phase 1  executor ─writes code + tests─▶ checker ─pass/fail/regressed─▶ (loop ≤5)
Phase 2  reviewer ─privacy / reuse / coverage─▶ fix BLOCKING ─▶ re-check (loop ≤2)
/goal    …wrap all of the above ─▶ goal-checker judges criteria ─▶ (loop ≤5) ─▶ DONE
```

## The compact checker

`.claude/scripts/check_tests.py` parses the runner's JSON, stores per-test results in a
**manifest** (`.claude/state/test-manifest.json`), and computes **regressions** by
diffing against the last run — a test that passed last cycle and now fails/was
deleted shows up as `REGRESSED`. The report carries only counts + failures +
regressions, so the orchestrator's context stays small. `.claude/state/` is local
runtime only (git-ignored).

## ⚠️ Stack note — the test-runner gap (read this)

Factuurt's gate is `type-check + lint + Vitest`. **Femmie has no test runner, no lint
config, and no `type-check` script wired yet.** So the checker runs in **type-check-only
mode**: the authoritative green gate is `npx tsc --noEmit` (strict TS is already on), and
it reports `TESTS: NONE CONFIGURED`. A type-clean build is GREEN in that mode — but the
whole quality guarantee of this system rests on tests, so:

> **The highest-value first task for this pipeline is to set up the runner.** Run
> `/plan add jest-expo test runner + type-check and test npm scripts`, approve the one
> dependency add, and from then on every feature carries real tests and the checker
> gates on them automatically (it auto-detects the `test` script). Recommended scripts in
> `femmie/package.json`: `"type-check": "tsc --noEmit"`, `"test": "jest"`.

Until then the planner writes tests as it can and flags device-only behaviour as
`HUMAN-VERIFY`; the reviewer treats "untested but testable" as advisory, and "untested
health-data behaviour once a runner exists" as blocking.

## What blocks vs. what's advisory

- **Green gate (checker):** `npx tsc --noEmit` exits 0 in `femmie/` (and `backend/` if
  it changed) AND — once a runner exists — every test passes. Running the app / EAS
  builds / device checks stay **outside** the automated gate; you do those by hand.
- **Review gate (reviewer):** blocks on **privacy/security** (plaintext health/PII
  egress, PII in logs, committed secrets, auth holes, wipe bypass, unvalidated input),
  **missing tests** for new behaviour (once a runner exists), and **phantom
  mechanisms**. Reuse/duplication, layering, size, naming are **advisory**.
- **Goal gate (goal-checker):** MET only when every stated criterion has evidence
  (code + test, or a type guarantee) on disk.

## Stop rules

| Rule | Where | Effect |
|------|-------|--------|
| Escalate after cycle 2 | build-loop | Sonnet executor still red → Fable executor takes over |
| Max 5 build cycles | build-loop | not green after 5 → human |
| Regression | build-loop | a fix breaks a passing test → immediate stop |
| Max 2 review rounds | build-loop | reviewer still blocks after 2 fixes → human |
| Max 5 goal iterations | goal | criteria still unmet → human |
| Pipeline blocked | goal | a build-loop hard stop halts `/goal` |

## Anti-cheat
The executor may not delete, skip, or weaken tests or types to force green (no `any`,
no `@ts-ignore`, no silencing a real finding), and may never persist/send/log
unencrypted health data to make something work. A genuinely-wrong test may be corrected,
but only with written justification in its change summary.

## The guarantees
1. **Nobody marks their own homework.** The executor self-verifies (type-check + its own
   tests) but never owns the verdict — the checker is the sole authority on the full
   gate, the reviewer can't edit, and reviewer and goal-checker run on Opus 4.8, never on
   the model that built the code (Sonnet 5 or Fable 5). Separate context windows; the
   orchestrator relays only structured blocks.
2. **Quality compounds.** Once a runner exists, new behaviour ships with a test and the
   reviewer blocks on untested new behaviour.
3. **A fix can't silently break something else.** The manifest diff catches regressions
   deterministically.

## Portability — what knows the stack
Only three things are stack-specific: `agents/checker.md` (the gate commands),
`scripts/check_tests.py` (the runner JSON parser), and the repo maps/examples in the
other agent files. Everything else — orchestration, stop rules, structured blocks,
anti-cheat — is stack-agnostic. The pure-logic layer (`femmie/src/lib` / `src/domain`,
framework-free and testable) is what keeps iOS/Android and backend portable; the planner
and reviewer both push logic there.

## Tuning
- Model, effort, and turn caps → each `agents/*.md` frontmatter (`model:`, `effort:`,
  `maxTurns:`). The orchestrator's per-launch `model` overrides the pin.
- Cycle/round/iteration ceilings → `commands/build-loop.md` and `commands/goal.md`.
- When the test runner lands, flip the checker from type-check-only to the full gate
  (it already auto-detects; no edit needed).
