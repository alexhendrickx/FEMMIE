import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLogStore } from '../../store/logStore';
import { useMoodStore } from '../../store/moodStore';
import { extractPeriodStarts } from '../../lib/cycle';
import { drspDailyMean, evaluateMoodSafeguard, severityByCycle } from '../../lib/mood';
import { sortEntriesNewestFirst, formatSeverity } from '../../lib/moodForm';
import { DRSP_MAX } from '../../types/mood';
import { todayISO } from '../CycleCalendar/utils';
import { MoodSeverityCard } from './MoodSeverityCard';
import { MoodSafeguardCard } from './MoodSafeguardCard';
import { MoodLogSheet } from './MoodLogSheet';
import { colors } from '../../theme/colors';

const RECENT_LIMIT = 10;

export function MoodScreen() {
  const logs = useLogStore((s) => s.logs);
  const drspEnabled = useMoodStore((s) => s.drspEnabled);
  const entriesById = useMoodStore((s) => s.entries);
  const safeguardDismissed = useMoodStore((s) => s.safeguardDismissed);
  const setDrspEnabled = useMoodStore((s) => s.setDrspEnabled);
  const removeEntry = useMoodStore((s) => s.removeEntry);
  const dismissSafeguard = useMoodStore((s) => s.dismissSafeguard);
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = todayISO();
  const entries = useMemo(() => Object.values(entriesById), [entriesById]);
  const starts = useMemo(() => extractPeriodStarts(Object.values(logs)), [logs]);
  const cycles = useMemo(() => severityByCycle(entries, starts), [entries, starts]);
  const safeguard = useMemo(
    () => evaluateMoodSafeguard(entries, starts, safeguardDismissed),
    [entries, starts, safeguardDismissed],
  );
  const recent = useMemo(() => sortEntriesNewestFirst(entries).slice(0, RECENT_LIMIT), [entries]);
  const hasToday = Boolean(entriesById[today]);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.optInCard}>
          <View style={styles.optInRow}>
            <View style={styles.optInText}>
              <Text style={styles.optInLabel}>Structured mood record</Text>
              <Text style={styles.hint}>
                A 10-item daily record (DRSP) of how much mood-related problems affected you. Optional, and not a diagnosis.
              </Text>
            </View>
            <Switch
              value={drspEnabled}
              onValueChange={setDrspEnabled}
              trackColor={{ false: colors.border, true: colors.periodConfirmed }}
              accessibilityLabel="Structured mood record"
            />
          </View>
          <Text style={styles.hint}>
            Kept on this device, encrypted. Turning this off hides the record; your entries stay until you delete them or wipe the app.
          </Text>
        </View>

        {drspEnabled && (
          <>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setSheetOpen(true)}
              accessibilityLabel="Record today's DRSP items">
              <Text style={styles.fabText}>{hasToday ? "Edit today's record" : 'Record today'}</Text>
            </TouchableOpacity>

            <MoodSafeguardCard safeguard={safeguard} onDismiss={dismissSafeguard} />

            <MoodSeverityCard cycles={cycles} hasStarts={starts.length > 0} hasEntries={entries.length > 0} />

            {recent.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.heading}>RECENT RECORDS</Text>
                <View style={styles.card}>
                  {recent.map((e) => (
                    <View key={e.date} style={styles.row}>
                      <Text style={styles.rowDate}>{e.date}</Text>
                      <View style={styles.rowRight}>
                        <Text style={styles.rowMean}>
                          {formatSeverity(drspDailyMean(e) ?? 0)} / {DRSP_MAX}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeEntry(e.date)}
                          hitSlop={8}
                          accessibilityLabel={`Delete record for ${e.date}`}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <MoodLogSheet visible={sheetOpen} date={today} onClose={() => setSheetOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 24 },
  fab: { backgroundColor: colors.periodConfirmed, borderRadius: 16, paddingVertical: 17, alignItems: 'center', shadowColor: colors.periodConfirmed, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  fabText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
  block: { gap: 12 },
  heading: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44, paddingVertical: 8, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteText: { fontSize: 13, color: colors.textMuted },
  rowDate: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMean: { fontSize: 15, color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  optInCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  optInRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optInText: { flex: 1, gap: 4 },
  optInLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
});
