# Feature 30 · Accessibility (WCAG 2.2 AA, First-Class)

```
ROLE: Senior React Native / Expo dev
STACK: React Native, Expo, TypeScript

TASK: Implement WCAG 2.2 AA accessibility across the Luna app, with special focus on calendar and charts.

REQUIREMENTS:
- VoiceOver (iOS) + TalkBack (Android): all interactive elements labeled; calendar grid uses proper semantics
  (accessibilityRole="button", accessibilityLabel="May 19, confirmed period day")
- Dynamic Type: all text scales with system font size up to xxxLarge without overflow
- Color-independent state: every state communicated via color + shape + label (never color alone)
  → confirmed period: filled circle + "Confirmed" label in screen reader + distinct shape from predicted
- Reduced-motion: all animations respect AccessibilityInfo.isReduceMotionEnabled()
- Touch targets: minimum 44×44pt on all interactive elements
- Dyslexia-friendly font: OpenDyslexic option in settings (swap font family globally via theme)

AUDIT CADENCE: quarterly — results + remediation log published in Settings → "Accessibility Audit"

OUTPUT: accessibility audit of Phase 1 calendar component + fixes + dyslexia font setting + reduced-motion HOC.
CONSTRAINT: No state communicated by color alone. Hard requirement, not a nice-to-have.
```
