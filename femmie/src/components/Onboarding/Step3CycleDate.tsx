import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onComplete: (firstCycleDate: string | null) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildDayOptions(): number[] {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}

function buildMonthOptions(): { label: string; value: number }[] {
  const now = new Date();
  const options: { label: string; value: number; year: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, value: d.getMonth(), year: d.getFullYear() });
  }
  return options.map(({ label, value }) => ({ label, value }));
}

export function Step3CycleDate({ onComplete }: Props) {
  const now = new Date();
  const [selectedDay, setSelectedDay]   = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());

  const monthOptions = buildMonthOptions();

  const handleMonthSelect = (label: string) => {
    const found = monthOptions.find((m) => m.label === label);
    if (!found) return;
    // Extract year from label "Jan 2025"
    const parts = label.split(' ');
    setSelectedYear(parseInt(parts[1], 10));
    setSelectedMonth(found.value);
  };

  const handleConfirm = () => {
    const iso = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onComplete(iso);
  };

  const currentMonthLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.step}>Step 3 of 3</Text>
        <Text style={styles.title}>When did your last period start?</Text>
        <Text style={styles.body}>
          This helps Femmie predict your next cycle right away. You can skip if you prefer.
        </Text>
      </View>

      {/* Month selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthRow}
      >
        {monthOptions.map((m) => (
          <TouchableOpacity
            key={m.label}
            style={[styles.monthChip, m.label === currentMonthLabel && styles.monthChipSelected]}
            onPress={() => handleMonthSelect(m.label)}
          >
            <Text style={[styles.monthChipText, m.label === currentMonthLabel && styles.monthChipTextSelected]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Day grid */}
      <View style={styles.dayGrid}>
        {buildDayOptions().map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayCell, day === selectedDay && styles.dayCellSelected]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[styles.dayText, day === selectedDay && styles.dayTextSelected]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btn}
          onPress={handleConfirm}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Start tracking →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => onComplete(null)}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
  },
  top: {
    marginTop: 24,
    marginBottom: 24,
  },
  step: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 32,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  monthRow: {
    gap: 8,
    paddingBottom: 16,
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  monthChipSelected: {
    borderColor: colors.periodConfirmed,
    backgroundColor: colors.periodConfirmed + '15',
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  monthChipTextSelected: {
    color: colors.periodConfirmed,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.periodConfirmed,
    borderColor: colors.periodConfirmed,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  actions: {
    gap: 10,
    marginTop: 'auto',
  },
  btn: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.periodConfirmed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
