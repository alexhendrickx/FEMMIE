# Feature AUTH · Passkey Authentication + Onboarding Gate

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, Node.js, Fastify, TypeScript, PostgreSQL, PASETO v4

TASK: Implement device-native passkey authentication and an onboarding gate that guards all other screens.

AUTH FLOW:
- First launch → onboarding gate (no account = no app)
- Register with passkey (WebAuthn / device biometric) — no password, no email required
- Optional: add email as recovery contact only (never used for login)
- Login: passkey challenge → server issues PASETO v4.local token (24h expiry, 7d refresh)
- Token stored in expo-secure-store; refreshed silently on foreground

ONBOARDING STEPS (3 max):
  1. "This is your space" — privacy promise, one screen
  2. Passkey setup (Face ID / fingerprint prompt)
  3. First cycle date picker (or "skip, I'll add later")

API:
  POST /auth/register/begin   → { challenge, rpId }
  POST /auth/register/finish  { credential }  → { token, refreshToken }
  POST /auth/login/begin      → { challenge }
  POST /auth/login/finish     { assertion }   → { token, refreshToken }
  POST /auth/refresh          { refreshToken } → { token }
  DELETE /auth/session        → 204 (logout)

OUTPUT:
1. Fastify routes for passkey register/login/refresh using @simplewebauthn/server
2. React Native onboarding screens (3 steps, skip-safe)
3. Auth context + useAuth hook (token storage, refresh logic, logout)
4. App-level gate in App.tsx: unauthenticated → OnboardingStack, authenticated → MainStack

CONSTRAINT: App must be fully usable offline after first auth. Token refresh failure must not log the user out — show a "reconnect" banner instead.
```
