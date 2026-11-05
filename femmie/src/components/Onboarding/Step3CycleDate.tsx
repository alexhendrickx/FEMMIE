import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';
import {
  WEEKDAYS,
  buildMonthGrid,
  monthLabel,
  prevMonth,
  nextMonth,
  todayISO,
} from '../CycleCalendar/utils';
import type { MonthRef } from '../../types/calendar';

interface Props {
  onNext: (firstCycleDate: string | null) => void;
}

export function Step3CycleDate({ onNext }: Props) {
  const now = new Date();
  const currentRef: MonthRef = { year: now.getFullYear(), month: now.getMonth() };
  const today = todayISO();

  const [ref, setRef] = useState<MonthRef>(currentRef);
  const [selected, setSelected] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(ref, []), [ref]);

  // A last-period start can't be in the future, so block navigating past this month.
  const atCurrentMonth = ref.year === currentRef.year && ref.month === currentRef.month;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>When did your last period start?</Text>
        <Text style={styles.body}>
          Helps Femmie predict your next cycle. Skip if you're not sure.
        </Text>
      </View>

      <View style={styles.calendar}>
        {/* Month navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => setRef(prevMonth(ref))}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Text style={styles.navChevron}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel(ref)}</Text>
          <TouchableOpacity
            onPress={() => !atCurrentMonth && setRef(nextMonth(ref))}
            disabled={atCurrentMonth}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Text style={[styles.navChevron, atCurrentMonth && styles.navDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        {/* Day grid */}
        <View style={styles.grid}>
          {grid.map((cell) => {
            const isFuture = cell.date > today;
            const selectable = cell.isCurrentMonth && !isFuture;
            const isSelected = cell.date === selected;
            return (
              <View key={cell.date} style={styles.cellWrap}>
                <TouchableOpacity
                  disabled={!selectable}
                  onPress={() => setSelected(cell.date)}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: !selectable }}
                  accessibilityLabel={cell.date}
                >
                  <Text
                    style={[
                      styles.cellText,
                      !cell.isCurrentMonth && styles.cellTextOtherMonth,
                      isFuture && cell.isCurrentMonth && styles.cellTextFuture,
                      cell.isToday && !isSelected && styles.cellTextToday,
                      isSelected && styles.cellTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          disabled={!selected}
          onPress={() => selected && onNext(selected)}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Next →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => onNext(null)}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  top: { marginTop: 24, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10, lineHeight: 32 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  calendar: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navChevron: { fontSize: 26, color: colors.periodConfirmed, fontWeight: '600' },
  navDisabled: { color: colors.border },
  monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellWrap: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.periodConfirmed },
  cellText: { fontSize: 15, fontWeight: '500', color: colors.text },
  cellTextOtherMonth: { color: colors.border },
  cellTextFuture: { color: colors.textMuted },
  cellTextToday: { color: colors.periodConfirmed, fontWeight: '800' },
  cellTextSelected: { color: colors.textLight, fontWeight: '700' },

  actions: { gap: 10, marginTop: 'auto' },
  btn: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: colors.textMuted, opacity: 0.5 },
  btnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
  skipBtn: { paddingVertical: 14, alignItems: 'center' },
  skipText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});
