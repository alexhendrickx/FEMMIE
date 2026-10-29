# Feature 6 · Free Core / Premium Tier (No Dark Patterns)

```
ROLE: Senior full-stack dev
STACK: React Native, Expo, Node.js Fastify TS, PostgreSQL, Apple StoreKit 2, Google Play Billing

TASK: Implement a clean free/premium split with no dark-pattern paywalls.

FREE (always): tracking, calendar, predictions, health integration, basic insights
PREMIUM: AI insights, medical report export, partner sharing, perimenopause tools

RULES:
- No interstitial ads, no banner ads, no sponsored content
- Paywall only appears when user explicitly taps a premium feature (not during onboarding)
- Cancellation is one tap; no "are you sure" loops beyond one confirmation
- One-tap restore purchases

OUTPUT:
1. Entitlement middleware (Fastify plugin: checks premium flag on user record)
2. RN PaywallScreen component (monthly + annual; no auto-renew trickery copy)
3. StoreKit 2 + Play Billing purchase/restore hooks
CONSTRAINT: Premium gate shows feature preview first, paywall second — never a blank locked screen.
```
