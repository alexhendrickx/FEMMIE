# Femmie — UX design decisions

Running log of the "keuze-rondes" (A/B/C mockup sessions). Goal: a tracker that is
radically simpler and faster than the market — big buttons, one/two taps to logged,
mobile-perfect. These decisions feed the roadmap and `/build-loop`.

## Round 1 — logging flow (DECIDED)

- **Check-in style: A — one-tap check-in.** Opens to "How's today?" with 5 big mood
  faces (one tap). Flow buttons (light/medium/heavy) appear only on period days. Big
  **Done**, small "+ Add symptoms" for the rare detailed day. Must be dead simple.

## Round 2 — screen-level choices (DECIDED)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Mood vs flow order | **C — Smart/auto**: app uses the prediction to show flow-first on likely period days, mood-first otherwise. |
| 2 | Big symptom buttons | **C — Personal top 5**: user pins her own 5 on first launch; rest behind "+ more". |
| 3 | Opening screen | **A — Cycle ring** (day + phase) for now. AI-generated status text parked for a later version. |
| 4 | Navigation | **Keep 3 content areas, but simplify** — see open question below. |
| 5 | "Logged" feedback | **C — Button morphs into ✓** in place, no screen change. Fastest. |
| 6 | History view | **Mix, Google-Calendar style** — see open question below. |

## Round 3 — navigation, names, history (DECIDED)

| # | Decision | Choice |
|---|----------|--------|
| 7 | Navigation structure | **A — No tab bar.** One focused "Today" screen; a profile avatar (top-right) opens a panel with Health + Privacy. Max focus, everything one tap away. |
| 8 | Section names | **A — Today / You.** Main screen = "Today". Profile = "You", which **contains** Health + Privacy. |
| 9 | History view | **C — Segmented control: Week / Month / List.** Explicit toggle at the top. |

> **#8 build note (user):** the Health and Privacy screens are **kept**, not removed —
> they are relocated behind the "You" profile entry. Build the reorganisation correctly;
> don't delete functionality.

## Product direction — DAILY FLOW, not pages (key insight, round 3)

The user's north star: Femmie should feel like a **daily flow**, not a set of pages —
"a few little steps you do each day, like Duolingo; then you close it, and the next day a
notification brings you back." Open → do 2–4 tiny steps → done → close. Streak/rhythm +
notifications drive the daily return loop. This reframes the whole app around a short
repeatable session, with Today/You/history as supporting surfaces.

## Round 4 — the daily flow (DECIDED)

| # | Decision | Choice |
|---|----------|--------|
| 10 | Daily flow structure | **A — Swipe-through steps (Duolingo-style).** One question per screen, progress bar on top, "Next". Feels like a flow, not a form. |
| 11 | Return driver | **C — Notification only, no counter.** No streak, no guilt. A friendly daily notification brings the user back. The calm, pressure-free loop — Femmie's differentiator. |
| 12 | End of the round | **C — Insight of the day.** Check + a small personal insight (e.g. "you often cramp around this cycle day; warmth can help"), then "See you tomorrow 🌙". |

> Notification tap opens **straight into the flow**, not the Today page.

### Daily flow — assembled spec
1. **Notification** (morning, friendly, no streak pressure) → tap opens the flow directly.
2. **Step — Mood** (5 faces, one tap, "Next"). *(order per decision #1: smart)*
3. **Step — Flow** (light/medium/heavy) — only when likely on period *(decision #1)*.
4. **Step — Your top 5 symptoms** (personal set per decision #2; tap any / "all good").
5. **End — Insight of the day** + "See you tomorrow 🌙" → close.
- "Logged" uses the morph-to-✓ feel (decision #5) within each step.

## Round 5 — onboarding, personal top-5, prediction (DECIDED + refined in round 6)

| # | Decision | Choice |
|---|----------|--------|
| 13 | Onboarding | **Split into TWO sequential steps** (user feedback): Step 1 = tap last-period start date on a mini-calendar (+ "not sure" escape). Step 2 = cycle-length slider (default 28). Not an A/B choice — both steps happen in order. |
| 14 | Top-5 picker | **C — By category**, elaborated large. Full categorised symptom list with short explanations (user is learning, not a woman — wants the names + meaning spelled out). |
| 15 | Prediction on ring | **Hybrid A + C.** Simple big "In N days" center (A) **+** ring colour adapts to what the app predicts (phase/state) (C) **+** an info card below for contextual text — simple rule-based tips now, real AI advice later. Must state what's **upcoming in N days**. |

### Round 6 refinements (DECIDED)
- **16 — Cycle-length step: REQUIRED.** Step 2 is a deliberate slider set (default 28, but
  the user confirms it); gives an immediate prediction from day one.
- **17 — Quick symptoms: FLEXIBLE 5–8.** User may pin 5 up to 8 quick symptoms (not a hard 5).
- **18 — Advice card: CLEAN / EMPTY for now.** Per user: don't put any text in the
  prediction advice box yet — keep the ring clean. The info card (rule-based tips → AI
  advice later) is deferred. The Today ring shows only the big number + "upcoming in N
  days" for now.

> ✅ **UX spec complete (decisions 1–18).** Ready to build. Suggested first build target:
> the **daily flow** (notification → mood → flow → top-5 → end), since it's the heart of
> the app, then Today/ring, onboarding, history, and the You panel.

### Categorised symptom set (for the top-5 picker, decision #14)
Reference list to confirm / trim with the user:
- **Pain & body:** cramps, headache/migraine, back pain, tender breasts, bloating, nausea, leg cramps
- **Energy & sleep:** tired, high energy, trouble sleeping, restless
- **Mood:** irritable, mood swings, anxious/tense, sad, happy/positive, extra sensitive
- **Skin & hair:** acne/breakouts, oily skin, dry skin
- **Discharge/fluid:** dry, sticky, creamy, clear & stretchy (fertile sign), spotting
- **Cravings & appetite:** sweet cravings, salty cravings, more hunger, low appetite
- **Digestion:** constipation, diarrhea, gassy
- **Libido:** higher, lower

> Discharge type and clear/stretchy fluid are meaningful fertility signals — worth keeping
> as options even though they're less obvious than cramps/mood.

## Principles (apply to every decision)
- Privacy is the differentiator — keep it reachable, never hidden so deep it feels gone.
- Fewest taps from app-open to "logged". Big touch targets. English UI copy.
- Design tokens from `src/theme/colors.ts`; iOS HIG; mobile-first.
