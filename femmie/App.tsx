import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { scheduleBedtimeReminder } from './src/utils/notifications';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { OnboardingScreen, ReconnectBanner } from './src/components/Onboarding';
import { CycleSummary } from './src/components/CycleRing';
import { TodayOutlookCard } from './src/components/TodayOutlook';
import { DailyFlow } from './src/components/DailyFlow';
import { YouSheet } from './src/components/You';
import { CalendarModal } from './src/components/Calendar';
import { useLogStore, isLogStoreHydrationSettled, onLogStoreHydrationSettled } from './src/store/logStore';
import { colors } from './src/theme/colors';
import {
  extractPeriodStarts,
  currentCycleDay,
  averageCycleLength,
  cyclePhase,
} from './src/lib/cycle';
import { todayISO } from './src/components/CycleCalendar/utils';

// ── Main app (shown after auth) ───────────────────────────────────────────────
function MainApp() {
  const { isOffline } = useAuth();
  const [youOpen, setYouOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const logs = useLogStore((s) => s.logs);
  const hasLoggedToday = useLogStore((s) => s.hasLoggedToday);
  const alreadyLogged = hasLoggedToday();
  const reminderEnabled = useLogStore((s) => s.reminderEnabled);

  // Keep the daily reminder scheduled, and open the flow straight away when the user
  // taps the notification (UX decision #11).
  useEffect(() => {
    if (reminderEnabled) {
      void scheduleBedtimeReminder();
    }
    const sub = Notifications.addNotificationResponseReceivedListener(() => setFlowOpen(true));
    return () => sub.remove();
  }, [reminderEnabled]);

  // Everything the Today screen + flow needs, derived from the real store.
  const today = todayISO();
  const derived = useMemo(() => {
    const logList = Object.values(logs);
    const starts = extractPeriodStarts(logList);
    const cycleDay = currentCycleDay(starts, today);
    const avg = averageCycleLength(starts);
    const phase = cycleDay !== null ? cyclePhase(cycleDay, avg) : null;
    const isLikelyPeriod = phase === 'period';
    return { cycleDay, isLikelyPeriod };
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

          <CycleSummary onPressRing={() => setCalendarOpen(true)} />
          <TodayOutlookCard />

          <View style={styles.bottomBar}>
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
        </View>

        <DailyFlow
          visible={flowOpen}
          date={today}
          cycleDay={derived.cycleDay}
          isLikelyPeriod={derived.isLikelyPeriod}
          onClose={() => setFlowOpen(false)}
          onSaved={() => setFlowOpen(false)}
        />

        <YouSheet visible={youOpen} onClose={() => setYouOpen(false)} />

        <CalendarModal
          visible={calendarOpen}
          onClose={() => setCalendarOpen(false)}
          onDayLog={() => {
            setCalendarOpen(false);
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
  const onboardingDone = useLogStore((s) => s.onboardingDone);
  const completeOnboarding = useLogStore((s) => s.completeOnboarding);
  // The encrypted store hydrates asynchronously; wait for it so a returning user
  // never sees a flash of onboarding.
  const hydrated = useSyncExternalStore(onLogStoreHydrationSettled, isLogStoreHydrationSettled);
  const saveLog = useLogStore((s) => s.saveLog);
  const setCycleLengthPref = useLogStore((s) => s.setCycleLengthPref);

  // Store the stated cycle length and seed the first period start, so predictions and
  // the calendar are alive from day one (UX decision #16) instead of an empty ring.
  const finishOnboarding = (firstCycleDate: string | null, cycleLength: number) => {
    setCycleLengthPref(cycleLength);
    // Never overwrite a day that already has a log (e.g. pulled from sync on a new device).
    if (firstCycleDate && !useLogStore.getState().logs[firstCycleDate]) {
      saveLog({
        date: firstCycleDate,
        cycleDay: 1,
        entries: [{ categoryId: 'menstrual_flow', value: 'medium' }],
      });
    }
    completeOnboarding();
  };

  if (isLoading || !hydrated) {
    return <View style={styles.splash} />;
  }

  if (!isAuthenticated || !onboardingDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <OnboardingScreen onComplete={finishOnboarding} signedIn={isAuthenticated} />
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
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    gap: 4,
  },
  fab: {
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
