# Feature NAV · App Shell & Navigation Structure

```
ROLE: Senior React Native / Expo dev
STACK: React Native, Expo, TypeScript, React Navigation v7

TASK: Replace the prototype tab bar with the final navigation shell before Phase 2 screens are built.

BOTTOM NAV (4 tabs, final structure):
  🌙  Home      → CycleCalendar (F1-01) + Log FAB (F1-02)
  📊  Insights  → placeholder screen; populated by Phase 2 features (F2-07 → F2-13)
  ❤️  Health    → HealthIntegrationScreen (F1-03)
  ⚙️  Settings  → PrivacyScreen (F1-04), account, notifications

NAVIGATION HIERARCHY:
  Root
  ├── AuthStack (no bottom nav)
  │   └── OnboardingScreen (F1-AUTH)
  └── MainStack (bottom nav always visible)
      ├── HomeTab
      │   ├── CycleCalendarScreen
      │   └── DayDetailScreen (modal, from DaySheet tap)
      ├── InsightsTab
      │   └── InsightsPlaceholderScreen ("More insights coming soon")
      ├── HealthTab
      │   └── HealthIntegrationScreen
      └── SettingsTab
          ├── SettingsScreen (list of links)
          ├── PrivacyScreen
          └── AccountScreen (PASETO-authenticated, profile + logout)

DEEP LINKS:
  femmie://log/:date        → opens DailyLogSheet for that date
  femmie://insights/:id     → opens specific insight card (Phase 2)
  femmie://settings/privacy → opens PrivacyScreen directly

OUTPUT:
1. React Navigation v7 stack setup (AuthStack + MainStack + tab navigator)
2. Typed navigation params (RootStackParamList, TabParamList)
3. SettingsScreen (list component linking to sub-screens)
4. InsightsPlaceholderScreen (empty state with "first insight unlocks after 3 cycles")
5. Move existing screens into correct nav positions; wire FAB to DayDetailScreen modal

CONSTRAINT: Bottom nav must not render inside modals or the onboarding stack. Typed params must cover every route — no `any` casts in navigation calls.
```
