import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { buildAgenda, type AgendaDay } from '../../lib/agenda';
import { colors } from '../../theme/colors';
import type { DailyLog } from '../../types/logging';
import type { DayState } from '../../types/calendar';

/**
 * Shared cycle Agenda — a chronological, Google-Calendar-style list of days, used by
 * both You → History and the Home-ring "Calendar". One day = one row: a WHOLE-DATE
 * colour block (no dots) driven by the cycle state, plus that day's logged entries.
 * All colours come from the theme tokens (CLAUDE.md rule 5); all day math comes from
 * `lib/agenda` so this component stays presentational.
 */

interface AgendaProps {
  logs: DailyLog[];
  today: string;
  /** Tapping a day (e.g. to log / edit it). Rows are static when omitted. */
  onDayPress?: (date: string) => void;
  /** Rendered after the last section — e.g. the Insights/patterns block. */
  footer?: React.ReactNode;
}

/** Whole-date colour + text colour for each cycle state (Femmie tokens only). */
const BLOCK: Record<Exclude<DayState, null>, { bg: string; fg: string; border?: string }> = {
  confirmed: { bg: colors.periodConfirmed, fg: colors.textLight },
  fertile: { bg: colors.fertileAccent, fg: colors.text },
  // A soft rose tint for the predicted window — distinct from a solid period day.
  predicted: { bg: colors.periodPredicted + '22', fg: colors.periodConfirmed, border: colors.periodPredicted },
};

const STATE_LABEL: Record<Exclude<DayState, null>, string> = {
  confirmed: 'Period',
  predicted: 'Predicted period',
  fertile: 'Fertile window',
};

export function Agenda({ logs, today, onDayPress, footer }: AgendaProps) {
  const sections = useMemo(() => buildAgenda(logs, today), [logs, today]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <View key={section.monthKey} style={styles.section}>
          <Text style={styles.monthHeader}>{section.monthLabel}</Text>
          {section.days.map((day) => (
            <AgendaRow key={day.date} day={day} onPress={onDayPress} />
          ))}
        </View>
      ))}
      {footer}
    </ScrollView>
  );
}

function AgendaRow({ day, onPress }: { day: AgendaDay; onPress?: (date: string) => void }) {
  const block = day.state ? BLOCK[day.state] : null;
  const stateLabel = day.state ? STATE_LABEL[day.state] : null;

  const dateBlock = (
    <View
      style={[
        styles.dateBlock,
        block && { backgroundColor: block.bg },
        block?.border && { borderWidth: 1.5, borderColor: block.border },
        day.isToday && !block && styles.dateBlockToday,
      ]}
    >
      <Text
        style={[
          styles.weekday,
          { color: block ? block.fg : day.isToday ? colors.textLight : colors.textMuted },
        ]}
      >
        {day.isToday ? 'TODAY' : day.weekdayLabel.toUpperCase()}
      </Text>
      <Text
        style={[
          styles.dayNum,
          { color: block ? block.fg : day.isToday ? colors.textLight : colors.text },
        ]}
      >
        {day.dayOfMonth}
      </Text>
    </View>
  );

  const detail = (
    <View style={styles.detail}>
      {day.summary.length > 0 ? (
        <View style={styles.chips}>
          {day.summary.map((item, i) => (
            <View key={`${item.categoryId}-${i}`} style={styles.chip}>
              <Text style={styles.chipIcon}>{item.icon}</Text>
              <Text style={styles.chipLabel}>
                {item.label}
                {item.valueLabel ? ` · ${item.valueLabel}` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : stateLabel ? (
        <Text style={[styles.stateLabel, day.isFuture && styles.stateLabelFuture]}>{stateLabel}</Text>
      ) : (
        <Text style={styles.nothing}>Nothing logged</Text>
      )}
      {day.cycleDay !== null && <Text style={styles.cycleDay}>Cycle day {day.cycleDay}</Text>}
    </View>
  );

  if (!onPress) {
    return <View style={styles.row}>{dateBlock}{detail}</View>;
  }
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(day.date)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${day.date}${stateLabel ? `, ${stateLabel}` : ''}${day.isToday ? ', today' : ''}`}
    >
      {dateBlock}
      {detail}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
  section: { paddingTop: 12 },
  monthHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateBlock: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dateBlockToday: { backgroundColor: colors.today },
  weekday: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  dayNum: { fontSize: 20, fontWeight: '700', lineHeight: 24 },
  detail: { flex: 1, gap: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  chipIcon: { fontSize: 12 },
  chipLabel: { fontSize: 13, color: colors.textSecondary },
  stateLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  stateLabelFuture: { color: colors.textSecondary, fontWeight: '500' },
  nothing: { fontSize: 14, color: colors.textMuted },
  cycleDay: { fontSize: 12, color: colors.textMuted },
});
