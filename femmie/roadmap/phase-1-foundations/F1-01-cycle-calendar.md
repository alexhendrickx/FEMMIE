# Feature 1 · Clean Cycle Calendar (Month + Year Views)

```
ROLE: Senior React Native / Expo dev
STACK: React Native, Expo, TypeScript

TASK: Build a calendar-first home screen component for a period tracking app.

SPECS:
- Month view default, year view one tap away
- 3 visual states per day: confirmed period (filled dot), predicted period (dotted ring), fertile/ovulation window (accent color)
- Swipe between months; pinch to collapse into year view
- Tap any day → log/view sheet (no nested menus)
- Today always visually anchored
- Zero promotional banners on calendar surface

OUTPUT: Expo/RN component(s) with TypeScript types, no inline styles (StyleSheet only).
CONSTRAINT: Use a flat data structure [{date: string, state: 'confirmed'|'predicted'|'fertile'|null}] as input prop.
```
