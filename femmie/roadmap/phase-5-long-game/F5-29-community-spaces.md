# Feature 29 · Community Spaces (Moderated Like They Matter)

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, PostgreSQL, Redis, React Native, Expo

TASK: Build topic-based community spaces with paid moderation and no upvote arms race.

SPACES: Cycle Questions, Perimenopause, PCOS, TTC, Endometriosis (expandable)

POST MODEL:
- Anonymous by default (no username required)
- Chronological threads only; no upvote/downvote (emoji reactions only: ❤️ 🤗 💡)
- Flagged posts → moderator queue

MODERATION:
- Paid moderator role (internal CMS for queue management)
- Three enforced rules: no misinformation, no medical advice, no harassment
- First offense: post removed + message. Second: 7-day suspension. Third: permanent.

AMAs:
- Monthly scheduled AMA: clinician posts intro thread → open 24h → marked concluded

REDIS: rate limiting (5 posts per user per 10min) + session tracking for anonymous posting

OUTPUT: Fastify community routes + moderation queue API + RN community screen + thread component.
CONSTRAINT: Chronological feed only — no algorithmic ranking, no engagement optimization.
```
