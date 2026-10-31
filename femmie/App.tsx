import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OnboardingScreen, ReconnectBanner } from './src/components/Onboarding';
import { CycleCalendar } from './src/components/CycleCalendar';
import { CycleSummary } from './src/components/CycleRing';
import { DailyLogSheet } from './src/components/DailyLog/DailyLogSheet';
import { HealthIntegrationScreen } from './src/components/HealthIntegration/HealthIntegrationScreen';
import { PrivacyScreen } from './src/components/PrivacyScreen';
import { useLogStore } from './src/store/logStore';
import { colors } from './src/theme/colors';
import type { DayData } from './src/types/calendar';

// ── Demo data ────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().slice(0, 10);
const y = new Date().getFullYear();
const m = String(new Date().getMonth() + 1).padStart(2, '0');

const DEMO_DAYS: DayData[] = [
  { date: `${y}-${m}-01`, state: 'confirmed' },
  { date: `${y}-${m}-02`, state: 'confirmed' },
  { date: `${y}-${m}-03`, state: 'confirmed' },
  { date: `${y}-${m}-04`, state: 'confirmed' },
  { date: `${y}-${m}-05`, state: 'confirmed' },
  { date: `${y}-${m}-14`, state: 'fertile' },
  { date: `${y}-${m}-15`, state: 'fertile' },
  { date: `${y}-${m}-16`, state: 'fertile' },
  { date: `${y}-${m}-28`, state: 'predicted' },
  { date: `${y}-${m}-29`, state: 'predicted' },
  { date: `${y}-${m}-30`, state: 'predicted' },
];

const SUGGESTED_IDS = ['menstrual_flow', 'cramps', 'fatigue', 'mood', 'sleep_quality'];

// ── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'home' | 'health' | 'privacy';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home',    label: 'Home',    icon: '🌙' },
  { id: 'health',  label: 'Health',  icon: '❤️' },
  { id: 'privacy', label: 'Privacy', icon: '🔒' },
];

// ── Main app (shown after auth) ───────────────────────────────────────────────
function MainApp() {
  const { isOffline } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [logOpen, setLogOpen] = useState(false);
  const { hasLoggedToday } = useLogStore();
  const alreadyLogged = hasLoggedToday();

  return (
    <>
      <ReconnectBanner visible={isOffline} />
      <SafeAreaView style={styles.safe}>

        {/* ── Screens ── */}
        {tab === 'home' && (
          <View style={styles.screen}>
            <CycleSummary onPressRing={() => setLogOpen(true)} />
            <CycleCalendar days={DEMO_DAYS} onDayLog={() => setLogOpen(true)} />
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setLogOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={alreadyLogged ? 'Edit today' : 'Log today'}
            >
              <Text style={styles.fabText}>
                {alreadyLogged ? '✏️  Edit today' : '＋  Log today'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {tab === 'health'  && <HealthIntegrationScreen />}
        {tab === 'privacy' && <PrivacyScreen />}

        {/* ── Bottom tab bar ── */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={() => setTab(t.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.id }}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {tab === t.id && <View style={styles.tabDot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Daily log sheet ── */}
        <DailyLogSheet
          visible={logOpen}
          date={TODAY}
          cycleDay={4}
          suggestedCategoryIds={SUGGESTED_IDS}
          onClose={() => setLogOpen(false)}
          onSaved={() => setLogOpen(false)}
        />
      </SafeAreaView>
    </>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AppGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (isLoading) {
    return <View style={styles.splash} />;
  }

  if (!isAuthenticated || !onboardingDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </SafeAreaView>
    );
  }

  return <MainApp />;
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.periodConfirmed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.periodConfirmed,
    fontWeight: '700',
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.periodConfirmed,
    marginTop: 2,
  },
});
