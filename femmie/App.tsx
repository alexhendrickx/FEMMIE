import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OnboardingScreen, ReconnectBanner } from './src/components/Onboarding';
import { CycleSummary } from './src/components/CycleRing';
import { DailyLogSheet } from './src/components/DailyLog/DailyLogSheet';
import { YouSheet } from './src/components/You';
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

// ── Main app (shown after auth) ───────────────────────────────────────────────
function MainApp() {
  const { isOffline } = useAuth();
  const [youOpen, setYouOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const { hasLoggedToday } = useLogStore();
  const alreadyLogged = hasLoggedToday();

  return (
    <>
      <ReconnectBanner visible={isOffline} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.screen}>
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setYouOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
            >
              <Text style={styles.avatarText}>🌙</Text>
            </TouchableOpacity>
          </View>

          <CycleSummary onPressRing={() => setLogOpen(true)} />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setLogOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={alreadyLogged ? 'Edit today' : 'Start today'}
          >
            <Text style={styles.fabText}>
              {alreadyLogged ? '✏️  Edit today' : '＋  Start today'}
            </Text>
          </TouchableOpacity>
        </View>

        <DailyLogSheet
          visible={logOpen}
          date={TODAY}
          cycleDay={4}
          suggestedCategoryIds={SUGGESTED_IDS}
          onClose={() => setLogOpen(false)}
          onSaved={() => setLogOpen(false)}
        />

        <YouSheet
          visible={youOpen}
          onClose={() => setYouOpen(false)}
          calendarDays={DEMO_DAYS}
          onCalendarDayLog={() => {
            setYouOpen(false);
            setLogOpen(true);
          }}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  topBarSpacer: { flex: 1 },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18 },
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
});
