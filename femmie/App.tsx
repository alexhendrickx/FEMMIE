import React, { useMemo, useState } from 'react';
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
import { DailyFlow } from './src/components/DailyFlow';
import { YouSheet } from './src/components/You';
import { useLogStore } from './src/store/logStore';
import { colors } from './src/theme/colors';
import {
  extractPeriodStarts,
  currentCycleDay,
  averageCycleLength,
  cyclePhase,
} from './src/lib/cycle';
import { buildCalendarDays } from './src/lib/calendar';
import { todayISO } from './src/components/CycleCalendar/utils';

// ── Main app (shown after auth) ───────────────────────────────────────────────
function MainApp() {
  const { isOffline } = useAuth();
  const [youOpen, setYouOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const logs = useLogStore((s) => s.logs);
  const hasLoggedToday = useLogStore((s) => s.hasLoggedToday);
  const alreadyLogged = hasLoggedToday();

  // Everything the Today screen + flow needs, derived from the real store.
  const today = todayISO();
  const derived = useMemo(() => {
    const logList = Object.values(logs);
    const starts = extractPeriodStarts(logList);
    const cycleDay = currentCycleDay(starts, today);
    const avg = averageCycleLength(starts);
    const phase = cycleDay !== null ? cyclePhase(cycleDay, avg) : null;
    const isLikelyPeriod = phase === 'period';
    return {
      cycleDay,
      isLikelyPeriod,
      calendarDays: buildCalendarDays(logList, today),
    };
  }, [logs, today]);

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

          <CycleSummary onPressRing={() => setFlowOpen(true)} />

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setFlowOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={alreadyLogged ? 'Update today' : 'Start today'}
          >
            <Text style={styles.fabText}>
              {alreadyLogged ? '✓  Logged — update' : '＋  Start today'}
            </Text>
          </TouchableOpacity>
        </View>

        <DailyFlow
          visible={flowOpen}
          date={today}
          cycleDay={derived.cycleDay}
          isLikelyPeriod={derived.isLikelyPeriod}
          onClose={() => setFlowOpen(false)}
          onSaved={() => setFlowOpen(false)}
        />

        <YouSheet
          visible={youOpen}
          onClose={() => setYouOpen(false)}
          calendarDays={derived.calendarDays}
          onCalendarDayLog={() => {
            setYouOpen(false);
            setFlowOpen(true);
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
