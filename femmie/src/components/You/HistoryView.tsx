import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { CycleCalendar } from '../CycleCalendar';
import { todayISO } from '../CycleCalendar/utils';
import { useLogStore } from '../../store/logStore';
import { buildWeekCells, loggedDaysDescending, summarizeDay } from '../../lib/history';
import { colors } from '../../theme/colors';
import type { DayData, DayState } from '../../types/calendar';

type Segment = 'week' | 'month' | 'list';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'list', label: 'List' },
];

interface HistoryViewProps {
  calendarDays: DayData[];
  onDayLog?: (date: string) => void;
}

export function HistoryView({ calendarDays, onDayLog }: HistoryViewProps) {
  const [segment, setSegment] = useState<Segment>('month');

  return (
    <View style={styles.container}>
      <SegmentedControl value={segment} onChange={setSegment} />
      {segment === 'month' && <CycleCalendar days={calendarDays} onDayLog={onDayLog} />}
      {segment === 'week' && <WeekStrip calendarDays={calendarDays} />}
      {segment === 'list' && <LogList />}
    </View>
  );
}

function SegmentedControl({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (s: Segment) => void;
}) {
  return (
    <View style={styles.segmentTrack}>
      {SEGMENTS.map((seg) => {
        const active = seg.id === value;
        return (
          <TouchableOpacity
            key={seg.id}
            style={[styles.segment, active && styles.segmentActive]}
            onPress={() => onChange(seg.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={seg.label}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {seg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function WeekStrip({ calendarDays }: { calendarDays: DayData[] }) {
  const cells = useMemo(() => buildWeekCells(todayISO()), []);
  const stateByDate = useMemo(
    () => new Map(calendarDays.map((d) => [d.date, d.state])),
    [calendarDays],
  );

  return (
    <View style={styles.weekStrip}>
      {cells.map((cell) => {
        const state = stateByDate.get(cell.date) ?? null;
        return (
          <View key={cell.date} style={styles.weekCell}>
            <Text style={styles.weekLabel}>{cell.weekdayLabel}</Text>
            <View style={[styles.weekDayCircle, cell.isToday && styles.weekDayCircleToday]}>
              <Text style={[styles.weekDayNum, cell.isToday && styles.weekDayNumToday]}>
                {cell.dayOfMonth}
              </Text>
            </View>
            <StateDot state={state} />
          </View>
        );
      })}
    </View>
  );
}

function StateDot({ state }: { state: DayState }) {
  if (state === 'confirmed') return <View style={[styles.dot, styles.dotConfirmed]} />;
  if (state === 'predicted') return <View style={[styles.dot, styles.dotPredicted]} />;
  if (state === 'fertile') return <View style={[styles.dot, styles.dotFertile]} />;
  return <View style={styles.dot} />; // reserve space so cells stay aligned
}

function LogList() {
  const logs = useLogStore((s) => s.logs);
  const days = useMemo(() => loggedDaysDescending(logs), [logs]);

  if (days.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🌙</Text>
        <Text style={styles.emptyText}>Nothing logged yet</Text>
        <Text style={styles.emptyHint}>Days you log will show up here.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
      {days.map((log) => (
        <View key={log.date} style={styles.listRow}>
          <Text style={styles.listDate}>{formatRowDate(log.date)}</Text>
          <View style={styles.chips}>
            {summarizeDay(log).map((item, i) => (
              <View key={`${item.categoryId}-${i}`} style={styles.chip}>
                <Text style={styles.chipIcon}>{item.icon}</Text>
                <Text style={styles.chipLabel}>
                  {item.label}
                  {item.valueLabel ? ` · ${item.valueLabel}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function formatRowDate(iso: string): string {
  // Parse as UTC midnight so the displayed day never drifts across time zones.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Segmented control (iOS-style pills)
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.today,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  segmentLabelActive: { color: colors.text },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  weekCell: { flex: 1, alignItems: 'center', gap: 6 },
  weekLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekDayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayCircleToday: { backgroundColor: colors.today },
  weekDayNum: { fontSize: 15, fontWeight: '500', color: colors.text },
  weekDayNumToday: { color: colors.textLight, fontWeight: '700' },
  dot: { width: 7, height: 7, borderRadius: 4 }, // empty by default to keep rows aligned
  dotConfirmed: { backgroundColor: colors.periodConfirmed },
  dotPredicted: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.periodPredicted,
  },
  dotFertile: { backgroundColor: colors.fertile },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  listRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listDate: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipIcon: { fontSize: 13 },
  chipLabel: { fontSize: 13, color: colors.textSecondary },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 17, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
