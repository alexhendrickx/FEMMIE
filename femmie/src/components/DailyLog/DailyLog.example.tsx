/**
 * Example: wire DailyLogSheet onto the home screen.
 * The FAB shows "Log today" or "Edit today" based on store state.
 */
import React, { useEffect, useState } from 'react';
import { SafeAreaView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { DailyLogSheet } from './index';
import { useLogStore } from '../../store/logStore';
import { scheduleBedtimeReminder, cancelBedtimeReminder } from '../../utils/notifications';
import { colors } from '../../theme/colors';

// Replace with real values from your cycle engine (Feature 5)
const TODAY_ISO = new Date().toISOString().slice(0, 10);
const CYCLE_DAY = 3; // example
const SUGGESTED_IDS = ['menstrual_flow', 'cramps', 'fatigue', 'mood']; // from GET /logs/suggestions

export default function HomeScreenExample() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { hasLoggedToday, reminderEnabled, reminderTime, setReminder } = useLogStore();
  const alreadyLogged = hasLoggedToday();

  // Schedule / cancel bedtime reminder whenever the preference changes
  useEffect(() => {
    if (reminderEnabled) {
      scheduleBedtimeReminder(reminderTime.hour, reminderTime.minute);
    } else {
      cancelBedtimeReminder();
    }
  }, [reminderEnabled, reminderTime]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ... CycleCalendar sits here ... */}

      {/* Home screen log button */}
      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={alreadyLogged ? 'Edit today' : 'Log today'}
        >
          <Text style={styles.fabText}>
            {alreadyLogged ? '✏️  Edit today' : '＋  Log today'}
          </Text>
        </TouchableOpacity>
      </View>

      <DailyLogSheet
        visible={sheetOpen}
        date={TODAY_ISO}
        cycleDay={CYCLE_DAY}
        suggestedCategoryIds={SUGGESTED_IDS}
        onClose={() => setSheetOpen(false)}
        onSaved={(date) => {
          console.log('Saved log for', date);
          // → POST /logs with entries from the store if you want server sync
        }}
      />

      {/* Reminder toggle — put this in your settings screen */}
      <TouchableOpacity
        onPress={() => setReminder(!reminderEnabled)}
        style={styles.reminderBtn}
      >
        <Text style={styles.reminderText}>
          Bedtime reminder: {reminderEnabled ? `ON (${reminderTime.hour}:${String(reminderTime.minute).padStart(2, '0')})` : 'OFF'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fab: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
  },
  fabBtn: {
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
  reminderBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
  reminderText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
