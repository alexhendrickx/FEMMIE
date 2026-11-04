import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLogStore } from '../../store/logStore';
import { scheduleBedtimeReminder, cancelBedtimeReminder } from '../../utils/notifications';
import { colors } from '../../theme/colors';
import { CATEGORY_MAP } from '../../data/categories';
import { QuickSymptomPicker } from '../QuickSymptoms';

export function SettingsScreen() {
  const { hasPasskey, isOffline, logout } = useAuth();
  const reminderEnabled = useLogStore((s) => s.reminderEnabled);
  const reminderTime = useLogStore((s) => s.reminderTime);
  const setReminder = useLogStore((s) => s.setReminder);
  const phaseContentMuted = useLogStore((s) => s.phaseContentMuted);
  const setPhaseContentMuted = useLogStore((s) => s.setPhaseContentMuted);
  const quickSymptomIds = useLogStore((s) => s.quickSymptomIds);
  const setQuickSymptoms = useLogStore((s) => s.setQuickSymptoms);
  const [editingSymptoms, setEditingSymptoms] = useState(false);

  const timeLabel = `${String(reminderTime.hour).padStart(2, '0')}:${String(reminderTime.minute).padStart(2, '0')}`;
  const symptomSummary = quickSymptomIds
    .map((id) => CATEGORY_MAP.get(id)?.label ?? id)
    .join(' · ');

  const toggleReminder = async (value: boolean) => {
    setReminder(value);
    if (value) await scheduleBedtimeReminder(reminderTime.hour, reminderTime.minute);
    else await cancelBedtimeReminder();
  };

  if (editingSymptoms) {
    return (
      <View style={styles.container}>
        <Text style={styles.editTitle}>Your daily check-ins</Text>
        <QuickSymptomPicker
          initial={quickSymptomIds}
          ctaLabel="Save"
          onDone={(ids) => {
            setQuickSymptoms(ids);
            setEditingSymptoms(false);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Text style={styles.line}>
          {hasPasskey ? 'Signed in with a passkey' : 'Signed in'}
        </Text>
        {isOffline && <Text style={styles.hint}>Offline — changes will sync later</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Daily reminder</Text>
            <Text style={styles.hint}>A gentle nudge every day at {timeLabel}</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={(v) => void toggleReminder(v)}
            trackColor={{ false: colors.border, true: colors.periodConfirmed }}
            accessibilityLabel="Daily reminder"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Home</Text>
        <View style={styles.row}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Mute phase content</Text>
            <Text style={styles.hint}>Hides the Today's outlook card and its cycle-phase notes</Text>
          </View>
          <Switch
            value={phaseContentMuted}
            onValueChange={setPhaseContentMuted}
            trackColor={{ false: colors.border, true: colors.periodConfirmed }}
            accessibilityLabel="Mute phase content"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Daily check-ins</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setEditingSymptoms(true)}
          accessibilityRole="button"
          accessibilityLabel="Edit your daily check-ins"
        >
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowLabel}>Your quick symptoms</Text>
            <Text style={styles.hint} numberOfLines={2}>{symptomSummary}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => { void logout(); }}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  line: { fontSize: 15, color: colors.text },
  hint: { fontSize: 13, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTextWrap: { flex: 1, paddingRight: 12, gap: 2 },
  rowLabel: { fontSize: 15, color: colors.text },
  chevron: { fontSize: 22, color: colors.textMuted },
  editTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.periodConfirmed },
});
