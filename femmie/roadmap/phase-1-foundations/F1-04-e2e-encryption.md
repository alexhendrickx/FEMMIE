# Feature 4 · Local-First, End-to-End Encrypted Data Model

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, libsodium (react-native-libsodium), Node.js Fastify TS, PostgreSQL, AWS KMS

TASK: Implement local-first E2E encrypted storage for a period tracking app.

SPECS:
- On-device SQLite as primary store; cloud sync is explicit opt-in
- Per-user encryption key derived via AWS KMS; libsodium for client-side encrypt/decrypt
- PASETO tokens for API auth (not JWT)
- "Panic wipe": clears local + cloud; 7-day soft-delete unless user requests immediate
- Plain-language privacy screen: what's stored, where, legal-process access, how to wipe

OUTPUT:
1. Encryption service module (keygen, encrypt, decrypt, wipe)
2. Fastify plugin for PASETO token validation
3. PostgreSQL migration: soft-delete columns + wipe_requested_at
CONSTRAINT: Never log decrypted payload in Datadog/Sentry; strip PII before error payloads.
```
