import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLogStore } from '../../store/logStore';
import { usePainStore } from '../../store/painStore';
import { extractPeriodStarts } from '../../lib/cycle';
import { painSummary } from '../../lib/pain';
import { describeLocations, sortEventsNewestFirst } from '../../lib/painForm';
import { todayISO } from '../CycleCalendar/utils';
import { PainSummaryCard } from './PainSummaryCard';
import { PainLogSheet } from './PainLogSheet';
import { colors } from '../../theme/colors';

const RECENT_LIMIT = 10;

/** You → Pain: log an episode, see the summary, review and delete recent episodes. */
export function PainScreen() {
  const logs = useLogStore((s) => s.logs);
  const events = usePainStore((s) => s.events);
  const removeEvent = usePainStore((s) => s.removeEvent);
  const [sheetOpen, setSheetOpen] = useState(false);

  const starts = useMemo(() => extractPeriodStarts(Object.values(logs)), [logs]);
  const summary = useMemo(() => painSummary(events, starts), [events, starts]);
  const recent = useMemo(() => sortEventsNewestFirst(events).slice(0, RECENT_LIMIT), [events]);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Log a pain episode"
        >
          <Text style={styles.fabText}>Log an episode</Text>
        </TouchableOpacity>

        <PainSummaryCard summary={summary} />

        {recent.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.heading}>RECENT EPISODES</Text>
            <View style={styles.card}>
              {recent.map((e) => (
                <View key={e.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowDate}>{e.date}</Text>
                    <Text style={styles.rowLocations}>{describeLocations(e.locations)}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.rowIntensity}>{e.intensity}/10</Text>
                    <TouchableOpacity
                      onPress={() => removeEvent(e.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete episode on ${e.date}`}
                      hitSlop={8}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <PainLogSheet
        visible={sheetOpen}
        date={todayISO()}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 24 },

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

  block: { gap: 12 },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { flex: 1, gap: 2 },
  rowDate: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowLocations: { fontSize: 13, color: colors.textSecondary },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowIntensity: { fontSize: 15, color: colors.text },
  deleteText: { fontSize: 13, color: colors.textMuted },
});
