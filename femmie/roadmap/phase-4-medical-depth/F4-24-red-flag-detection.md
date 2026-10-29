# Feature 24 · Red-Flag Detection (Calibrated, Not Alarming)

```
ROLE: Senior backend dev
STACK: Node.js, Fastify, TypeScript, TimescaleDB, PostgreSQL, BullMQ

TASK: Implement a calibrated alert system for clinically significant patterns — one alert, calm tone.

TRIGGERS (based on ACOG/NICE guidelines):
- Cycles consistently <21 or >35 days (not in perimenopause mode) — ≥3 consecutive cycles
- Very heavy bleeding: "heavy" or "very heavy" logged for ≥5 consecutive days
- Intermenstrual bleeding: period logged outside predicted window on ≥2 non-adjacent cycles
- Severe pain limiting daily activity: pain intensity ≥8 on ≥3 days in one cycle

ALERT RULES:
- Fire once per trigger type per 6-month window — never daily
- User can dismiss (permanent) or snooze (resurfaces in 4 weeks)
- Copy: "[Plain description of pattern]. This is worth discussing with your doctor."
- One-tap shortcut to generate Clinical Report (Feature 23)

OUTPUT: background detection job (BullMQ) + alerts table + Fastify alert endpoints + RN alert banner component.
CONSTRAINT: Zero diagnostic language. Never "you may have X". Only "this pattern is worth asking about".
```
