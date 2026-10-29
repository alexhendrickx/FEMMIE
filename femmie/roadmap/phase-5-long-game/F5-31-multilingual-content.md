# Feature 31 · Multilingual Content (Clinician-Reviewed per Region)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, TypeScript, i18next, Node.js Fastify

TASK: Build a multilingual content system where health content is clinician-reviewed per region, not auto-translated.

LAUNCH LANGUAGES: English, Spanish, French, German, Portuguese (BR), Arabic, Hindi, Mandarin

ARCHITECTURE:
- i18next for UI strings (standard translation workflow)
- Health/education content stored separately as structured content objects:
  { id, language, region, body, source, sourceDate, reviewedBy, reviewedAt }
- Fallback chain: exact locale → language default → English
- Region-aware clinical pathways (e.g., NHS referral path for en-GB, ACOG for en-US)

CONTENT MANAGEMENT:
- Internal admin routes (Fastify, access-controlled) for clinician reviewers to submit + approve content
- Every content block displays: source name + year + reviewer credential

OUTPUT: i18next setup + content table + Fastify content API + RN content renderer + admin review endpoints.
CONSTRAINT: No auto-translation for health content. If translation is not clinician-reviewed, show English with a "not yet available in [language]" notice.
```
