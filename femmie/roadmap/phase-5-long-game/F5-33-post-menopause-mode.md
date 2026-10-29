# Feature 33 · Menopause & Post-Menopause Continuation

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, PostgreSQL, TimescaleDB

TASK: Build a post-menopause mode that continues the app's value after the last period.

TRANSITION FLOW:
- User logs "I believe my last period was on [date]" → app enters post-menopause mode after 12 months with no period
- Or: user manually activates ("I'm post-menopausal")
- Calendar function gracefully retires → replaced with long-term health dashboard

POST-MENOPAUSE HOME:
- Continued tracking: sleep, mood, HRV, weight (from Health app integration, Feature 3)
- New focus: bone-health-relevant activity (weight-bearing exercise), cardiovascular signals
- Symptom tracking: ongoing hot flashes, brain fog, urinary/vaginal health with intensity scales
- HRT tracking: log + side-effect track (same engine as Feature 25)

EDUCATION:
- Dated, sourced content on cardiovascular health, bone density, cognitive health post-menopause
- Sourced from NHS Menopause Guidance, NAMS, BMS — labeled + dated

OUTPUT: post-menopause state machine + health dashboard screen + HRT log component.
CONSTRAINT: Never predict a period in post-menopause mode. Reactivating cycle mode requires explicit user action.
```
