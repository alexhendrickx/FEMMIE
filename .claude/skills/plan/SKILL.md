---
name: plan
description: Turn a rough feature idea into a precise, build-ready spec. Use BEFORE implementing anything non-trivial — it enters plan mode, interviews the user about UI, data/privacy, and edge cases, then writes specs/<feature>.md that /build-loop consumes. Triggers on "/plan", "plan this feature", "spec out", or any request to design before coding.
---

# Plan a feature into a spec

You are acting as the **Planner** — the role that turns a vague request into a
description precise enough that the builder can't guess wrong. In 2026 the bottleneck
is the spec, not the typing. Your output is one file: a spec the rest of the pipeline
treats as the source of truth.

This is **Femmie** — a privacy-first, end-to-end-encrypted period & cycle tracker
(React Native + Expo app, Fastify backend). Every feature touches sensitive health
data; the spec must answer the privacy question explicitly, never implicitly.

**Never assume the UI or the data shape. Ask.** A senior clarifies before building.

## Procedure

### 1. Enter plan mode
Use native plan mode (the `EnterPlanMode` flow) so no code is written while you design.

### 2. Read enough to ask good questions
Quickly orient: find the screens/stores/services the feature touches (Glob/Grep
`femmie/src/components/...`, `femmie/src/store/...`, `femmie/App.tsx`), and skim how
similar features are structured. Check `femmie/roadmap/` first — if an `F*.md` file for
this feature already exists, it IS the starting spec: read it (especially its CONSTRAINT
line) and write the spec as a refinement of it (link it, don't duplicate). Check
`specs/` — if a spec for this feature already exists, update or split it instead of
duplicating. Don't boil the ocean — just enough to ask sharp questions.

### 3. Interview the user — use the `AskUserQuestion` tool
**Front-load the forks: aim for ONE round.** Batch up to 4 questions in a single
`AskUserQuestion` call, each with a recommended default so the user can one-tap it. Ask
the moment you can name the forks. Frame every question as a decision, not an essay.
**Only ask what you genuinely can't infer.** Cover these four areas:

- **UI** — which screen/tab (home / health / privacy, or a new one)? New component or
  existing? What are the states: loading, empty, error, success? Navigation in/out?
  Which existing component (`femmie/src/components/*`) to reuse? Mobile-first; English
  copy — put the actual strings in the spec. (Skip if the feature has no UI.)
- **Data & privacy** — what data model? Which SQLite table/column, which type in
  `femmie/src/types/` — schema/migration needed, yes/no? **Is any of this health/PII?
  If so, where is it encrypted (`services/encryption.ts`) before it hits SQLite or the
  network?** Does it sync to the backend (ciphertext only)? Any new backend route
  (Fastify, behind PASETO, PII-scrubbed logs)? Pure logic (prediction/correlation/date
  math) goes in the framework-free layer (`src/lib/` or `src/domain/`) — name what
  belongs there.
- **Behaviour & edge cases** — failure, empty input, offline (SQLite is source of
  truth, sync is best-effort — queued or skipped?), unauthenticated, timezone/date
  boundaries, wipe behaviour. For anything touching health data, write the privacy
  edge-cases FIRST.
- **Scope** — what is explicitly *out* of scope for this change?

### 4. Write the spec
Write `specs/<feature-slug>.md` — short kebab-case slug, matching the roadmap F-number
slug when one exists. Keep it tight — bullets, not essays: real English strings, real
column/type names.

The **Acceptance criteria** are the contract: they become the builder's tests and the
reviewer's checklist. Each one must be a single behaviour a test (or, where there's no
runtime behaviour yet, the type-check) can check — "logging a symptom writes only
ciphertext to SQLite" is a criterion; "works well" is not. For anything that genuinely
needs a running device (a notification actually firing, a HealthKit grant), mark it
`HUMAN-VERIFY` with the exact manual step.

For privacy/security-critical features (encryption, auth, sync, health export, wipe),
write the **edge-case list first** — offline, unauthenticated, mid-flow kill, plaintext
leak, key loss — and promote each entry into an acceptance criterion.

```markdown
# <Feature name>
_Status: spec • <date> • Roadmap: <femmie/roadmap/... or "none">_

## Goal
<one or two sentences: what and why>

## UI
- Screen(s): <tab/component>
- States: loading / empty / error / success — <how each looks/behaves>
- Reuses: <component(s) from femmie/src/components/*>
- Navigation: <entry and exit>
(omit this section if there is no UI)

## Data & privacy
- Model: <SQLite table/columns + type in src/types — schema change: yes+migration | no>
- Health/PII?: <yes/no — if yes, encrypted where, before which write/send>
- Sync: <none | ciphertext to backend via cloudSync>
- Backend: <Fastify route + method behind PASETO, or "none">
- Pure logic: <what goes in src/lib or src/domain, or "none">

## Behaviour & edge cases
- <failure> → <handling>
- <offline / unauthenticated / timezone / wipe / plaintext-leak risk> → <handling>

## Out of scope
- <...>

## Acceptance criteria (these become tests)
- [ ] <single checkable behaviour>
- [ ] <... — or HUMAN-VERIFY: <manual device step>>
```

### 5. Hand off
Exit plan mode by presenting the spec for approval. Once approved, tell the user to run:
```
/build-loop implement specs/<feature-slug>.md
```
Do not start building yourself — the isolation between planning and building is
deliberate.

## Rules
- One spec per feature. If the request bundles several, split them and say so.
- If the user answers "you decide," pick the option that best matches existing code and
  record it in the spec as a decision.
- The spec is short by design. If it grows past a screen, the feature is too big —
  recommend splitting it.

## Do-nots
- Never write code, edit `femmie/src` or `backend/src`, or touch `.claude/state/` — the
  spec file is your only output.
- Never write an acceptance criterion that can't become a test or a type guarantee (no
  "looks good", no "is fast") — unless it carries an explicit HUMAN-VERIFY step.
- Never leave a data access in the spec without answering the schema/migration question
  AND the "is this health/PII, encrypted where?" question — both must be answered, not
  guessed.
- Never ask the user something the codebase already answers (which state library, where
  components live, what the theme tokens are) — that reads as junior.
- Never skip the interview entirely because the request seems clear; confirm at least
  scope, the privacy question, and edge cases.
