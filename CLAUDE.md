# Femmie / period_app — project instructions for Claude

## What this is

**Femmie** is a privacy-first, **end-to-end-encrypted** period & cycle tracker. It is a
native mobile app (not a website): React Native + Expo, iOS and Android from one
codebase, with a thin Fastify backend used only for encrypted sync and auth. The data is
menstrual, sexual and reproductive health — the most sensitive category there is. The
product promise is that **no readable health data ever leaves the user's device**. Treat
a plaintext leak as a product-ending bug, not a normal defect.

## Repository layout

- `femmie/` — the Expo app (this is the primary, active codebase).
  - `App.tsx` — the shell: a 3-tab UI (home 🌙 / health ❤️ / privacy 🔒).
  - `src/components/{CycleCalendar,DailyLog,HealthIntegration,PrivacyScreen,Onboarding}/` — feature UI.
  - `src/store/` — Zustand state (`logStore`, `healthStore`, `encryptionStore`).
  - `src/services/` — side-effecting services (`sqlite`, `encryption`, `cloudSync`, `authService`, `passkeyService`).
  - `src/health/` — HealthKit / Health Connect bridges.
  - `src/lib/` or `src/domain/` — **framework-free, unit-testable** cycle/health logic (prediction, correlations, date math). Create `src/domain/` here if neither exists.
  - `src/types/`, `src/theme/colors.ts`, `src/data/`, `src/utils/notifications.ts`.
- `backend/` and `femmie/backend/` — Fastify API (TS). Routes in `src/routes/` (`auth`, `encryption`); plugins in `src/plugins/` (`piiScrubber`, `paseto`); SQL in `migrations/`.
- `femmie/roadmap/` — the phased feature backlog (F1…F5), one prompt per feature.
- `.claude/` — the multi-agent build pipeline (see `.claude/README.md`).

## Stack

- **Mobile:** React Native 0.79 + Expo SDK 53, React 19, TypeScript **strict**. Path alias `@/*` → `femmie/src/*`.
- **State / local store:** Zustand + AsyncStorage; **SQLite** (`src/services/sqlite.ts`) is the offline-first source of truth.
- **Encryption:** libsodium via `src/services/encryption.ts` — sensitive data is ciphertext **before** it touches SQLite or the network.
- **Auth:** passkeys (`@simplewebauthn`) + **PASETO** v4 tokens (`backend/src/routes/auth.ts`, `src/services/passkeyService.ts`).
- **Health:** Apple HealthKit / Android Health Connect (`src/health/`).
- **Notifications:** `expo-notifications` (`src/utils/notifications.ts`) — currently **local** scheduled reminders.
- **Backend (intended at scale):** Node + Fastify + TS, PostgreSQL + TimescaleDB + Redis, AWS KMS. The server stores **ciphertext only**.

## Commands

| Goal | Command |
|------|---------|
| First-time setup (deps not installed) | `cd femmie && npm install` (and `cd backend && npm install` once it has a package.json) |
| Run the app | `cd femmie && npx expo start` (then `i` iOS / `a` Android) |
| Type-check (the current green gate, always before done) | `cd femmie && npx tsc --noEmit` |
| Type-check backend | `cd backend && npx tsc --noEmit` |
| Tests | ⚠️ **not wired yet** — see below |

> **No test runner, no lint, no npm `type-check`/`test` script exists yet.** The build
> pipeline runs in **type-check-only mode** until one is added. The single
> highest-value setup task is `/plan add jest-expo + type-check/test npm scripts`
> (one dependency add, needs your approval) — after that the pipeline gates on real
> tests automatically.

## Agent pipeline (`/plan` → `/build-loop` → `/goal`)

A multi-agent pipeline lives in `.claude/` (roles, gates, stop rules in
`.claude/README.md`): `/plan <idea>` interviews you and writes `specs/<feature>.md`;
`/build-loop <task|spec|roadmap file>` drives planner→executor→checker→reviewer to green
+ senior review; `/goal <criteria>` runs that unattended until an independent judge
confirms the criteria. Plans land in `.claude/state/plans/` (git-ignored); specs in
`specs/` (committed).

## Work rules

1. **Privacy is the first question, every time.** Before adding any field or call, ask:
   is this health/PII, and is it encrypted (`services/encryption.ts`) before it hits
   SQLite, the network, or a log? If you can't cite where, it's not done.
2. **No plaintext health/PII egress — ever.** Not to the backend, not to a log, not to
   analytics. The backend stores ciphertext; its logs go through `piiScrubber`.
3. **Pure logic in the framework-free layer.** Cycle math, prediction, correlations →
   `src/lib/`/`src/domain/`, no `react-native`/`expo`/SQLite imports, so it's testable
   and survives the iOS/Android/backend split.
4. **DRY & zero dead code** — check for an existing store/service/component before adding
   one; remove what your change makes obsolete.
5. **Design tokens** from `src/theme/colors.ts`; no hardcoded hex. **English** UI copy.
6. **Mobile-first**; touch targets comfortable; respect the 3-tab shell.
7. **Definition of done:** `tsc --noEmit` clean (app + backend if touched), tests green
   (once a runner exists), and the four senior questions — is it private/secure, is it
   efficient, does it break existing behaviour, are there tests?

### Never do

- Never persist, send, or log unencrypted health/cycle/PII data.
- Never weaken passkey/PASETO auth, or commit `PASETO_SECRET_KEY`/KMS keys/DB URLs.
- Never add a dependency without flagging and motivating it first.
- Never build a new primitive if an existing component/store/service can be extended.
- Never run destructive db/migration commands (`--force`, `--accept-data-loss`) without
  an explicit instruction.

## Git

This directory is **not a git repository yet**. There is no branch-per-ask workflow
until it's initialised (`git init`). When it is, follow the global CLAUDE.md rule:
branch per ask, verify, and ask before pushing.
