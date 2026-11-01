# Femmie — the full picture (how the whole app fits together)

Companion to `ux-decisions.md` (the 18 decisions). This doc threads those decisions
through the **entire** app so every screen reinforces one feeling, and flags where the
existing code / roadmap must shift. Source of truth for Phase-1 UX.

## The one feeling

Femmie is **a daily ritual, not a dashboard.** You open it because a gentle notification
invited you, you do a 10-second swipe flow, you get one small piece of value back, you
close it. No streak guilt, no page-hopping, no clutter. Everything that isn't "today"
lives one tap away behind a profile button. The product's edge vs. Clue/Flo/Flatter: it
feels like *Duolingo-calm*, is privacy-first (E2E encrypted), and never nags.

Every screen must pass one test: **does this make the app feel faster, calmer, and
simpler — or does it add a page?** If it adds a page, it goes behind "You".

## Information architecture (the whole app on one map)

```
Notification  ──tap──▶  DAILY FLOW  ──done──▶  TODAY (home)
 (friendly,                (swipe steps)         • cycle ring, colour-adaptive
  no streak)               1 Mood                • "upcoming in N days"
                           2 Flow (period days)  • big Check-in button
                           3 Your symptoms (5–8) • (clean — no advice text yet)
                           4 End = insight            │
                                                      │ profile avatar (top-right)
                                                      ▼
                                                   YOU  (bottom sheet / screen)
                                                    ├─ History  (Week / Month / List)
                                                    ├─ Health   (HealthKit / Connect)
                                                    ├─ Privacy & data  (E2E, export, lock)
                                                    └─ Settings (incl. premium, symptoms)

First run ─▶ ONBOARDING: step 1 last-period date → step 2 cycle length (required)
```

Only **two destinations** exist in the user's mind: **Today** and **You**. The daily flow
is a modal over Today. History/Health/Privacy/Settings are all *inside* You. That is the
whole app.

## Decision → concrete surface (keep / change / new)

| Area | Existing code | What changes |
|------|---------------|--------------|
| **Shell / nav** | 3-tab bar (home/health/privacy) in `App.tsx`; `F1-06-NAV` | **CHANGE.** Drop the tab bar. Today is the root; a profile avatar opens the "You" sheet containing Health + Privacy + History + Settings. Rename Home→Today. |
| **Daily logging** | FAB "Log today" → `DailyLogSheet` | **CHANGE.** Becomes a **swipe-step flow** (progress bar, one question per screen, "Next"), opened by the Check-in button *and* by notification tap. Reuse `DailyLog` category logic underneath. |
| **Check-in order** | static | **NEW.** Smart order: flow-first on likely period days, mood-first otherwise (uses prediction). |
| **Symptoms** | `suggestedCategoryIds` hardcoded in `App.tsx` | **CHANGE→NEW.** Personal **5–8** quick symptoms chosen once (by category), editable under You. Relates to roadmap `F2-13 custom tags` — pull the "pick your set" part into Phase 1. |
| **"Logged"** | sheet closes | **CHANGE.** Button morphs to ✓ in place; no screen change. |
| **Cycle ring** | `CycleRing`/`CycleSummary` | **CHANGE.** Colour adapts to predicted state (rose pre/during period, blue fertile) + center "N days" + "upcoming in N days". **Advice card deferred — keep clean.** |
| **Prediction** | `domain/cycle.ts`, `F1-05` | **KEEP + surface.** Feed the ring’s colour, number, and "upcoming". |
| **History** | `CycleCalendar` (month), `F1-01` | **CHANGE.** Segmented **Week / Month / List**; lives under You, not the root. |
| **Onboarding** | `Onboarding`, `F1-04b-AUTH` | **CHANGE.** Two explicit steps: date → cycle length (required). Keep passkey/auth gate. |
| **Notifications** | `utils/notifications.ts` (local) | **CHANGE.** One friendly daily reminder, **no streak/counter**; tapping deep-links straight into the flow. |
| **Premium** | `Paywall`, `F1-06` | **RE-SITUATE (see below).** |
| **Health** | `HealthIntegrationScreen` | **KEEP**, relocate under You. |
| **Privacy** | `PrivacyScreen` | **KEEP**, relocate under You — still prominent (it's the brand promise), just not a root tab. |

## Does the rest still feel right? (tensions to resolve)

1. **Premium / Paywall (F1-06).** A paywall that interrupts a 10-second daily ritual would
   break the whole feeling. Rule: **the daily flow is never gated.** Monetization lives
   under You → Settings, and premium unlocks *depth* (history range, exports, deeper
   insights/AI), never the core log. Revisit F1-06 with this constraint.
2. **Phase-2 intelligence (correlations, phase guidance, mood/pain, recap).** These must
   not become new tabs. They surface in exactly two slots: the **end-of-flow insight** and
   inside **You → History**. The clean advice card on Today is the eventual home for the
   AI companion (F4-26) — reserved now, empty until then.
3. **Phase-3+ modes (TTC, pregnancy, perimenopause, conditions).** These are *modes that
   reskin Today + the flow*, not extra destinations. Keep the two-destination model; a mode
   changes what the ring/flow ask, not the navigation.
4. **Richer tracking later (biometrics, medication, contraception).** Add as optional
   steps in the flow or fields under You — never as always-on clutter on Today.

## Build order (Phase 1, re-sequenced around the ritual)

1. **Nav shell** — Today root + You sheet; retire the 3-tab bar. (revises `F1-06-NAV`)
2. **Daily flow** — swipe steps (mood → flow → symptoms → end insight), morph-to-✓,
   smart order. *The heart — build first after the shell.* (revises `F1-02`)
3. **Today ring** — colour-adaptive + "upcoming in N days", advice card present but empty.
   (surfaces `F1-05`)
4. **Onboarding** — 2 steps. (revises `F1-04b`/`F1-AUTH` flow)
5. **Personal symptoms (5–8, by category)** — picker + edit under You. (pull-forward of `F2-13`)
6. **History** — Week/Month/List under You. (revises `F1-01`)
7. **Notifications** — friendly daily, deep-link into flow. (`utils/notifications.ts`)
8. **Premium re-situated** under You, never gating the flow. (revises `F1-06`)

Privacy, encryption, auth, sync (`F1-04`, `F1-AUTH`) are unchanged foundations underneath
all of the above — health/PII stays E2E-encrypted before SQLite/network, always.
