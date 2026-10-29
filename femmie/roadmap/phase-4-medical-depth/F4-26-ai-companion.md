# Feature 26 · AI Companion (Scoped, Honest, Encrypted)

```
ROLE: Senior full-stack dev
STACK: Node.js, Fastify, TypeScript, Anthropic API (Claude), PostgreSQL, libsodium, AWS KMS

TASK: Build a scoped AI companion — honest about uncertainty, refuses to diagnose.

SCOPE (strictly enforced via system prompt):
✅ Answers about the user's own logged data ("when did my cycles last shorten?")
✅ General reproductive-health education with cited sources
✅ Doctor-visit prep ("help me list questions for my gynecologist appointment")
❌ Diagnoses ("do I have PCOS?") → redirect to clinician
❌ Treatment recommendations → redirect to clinician

IMPLEMENTATION:
- System prompt includes user's data summary (cycle stats, recent symptoms) — never raw records
- Every educational answer must cite a source (Claude instructed to cite or refuse)
- Conversation history stored encrypted (libsodium) in PostgreSQL, local-first (sync opt-in)
- Stream responses via Fastify SSE endpoint

API:
  POST /companion/message { content, conversationId? } → SSE stream
  GET  /companion/conversations/:id
  DELETE /companion/conversations/:id

OUTPUT: Fastify SSE route + Claude API integration with safety system prompt + RN chat component + encrypted conversation store.
CONSTRAINT: System prompt must include explicit refusal instructions for diagnosis/treatment. Test these refusals before shipping.
```
