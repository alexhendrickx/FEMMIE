# Feature 8 · Cycle-Phase Guidance (Personalized, Not Generic)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, Node.js Fastify, TimescaleDB

TASK: Replace generic phase copy with a data-driven "today's outlook" card.

LOGIC:
- Pull user's historical logs for current cycle day range (±2 days across past cycles)
- Derive top 2 observations (energy, sleep, mood, pain) from that window
- Generate actionable suggestion only when pattern appears in ≥3 cycles
- Never make prescriptive medical claims — framed as "your pattern shows…"

API:
  GET /insights/today-outlook
  Response: {
    cycleDay: number, phase: string,
    observations: [{ signal: string, pattern: string }],  // max 2
    suggestion: string | null,
    dataBasis: string  // "Based on your last 6 cycles"
  }

UI: Single card on home screen below calendar; "mute phase content" toggle in settings.

OUTPUT: Fastify route handler + RN TodayOutlookCard component.
CONSTRAINT: If <3 cycles of data, show a neutral placeholder — never fabricate a pattern.
```
