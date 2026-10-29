import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { Category, EntryValue, FlowValue, MoodValue, ScaleValue } from '../../types/logging';

interface CategoryRowProps {
  category: Category;
  value: EntryValue | undefined;
  onChange: (categoryId: string, value: EntryValue) => void;
}

export const CategoryRow = memo(function CategoryRow({
  category,
  value,
  onChange,
}: CategoryRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.label}>
        <Text style={styles.icon}>{category.icon}</Text>
        <Text style={styles.name}>{category.label}</Text>
      </View>
      <View style={styles.control}>
        {category.inputType === 'flow' && (
          <FlowInput value={value as FlowValue} onChange={(v) => onChange(category.id, v)} />
        )}
        {category.inputType === 'scale' && (
          <ScaleInput value={value as ScaleValue} onChange={(v) => onChange(category.id, v)} />
        )}
        {category.inputType === 'mood' && (
          <MoodInput value={value as MoodValue} onChange={(v) => onChange(category.id, v)} />
        )}
        {category.inputType === 'boolean' && (
          <BooleanInput value={value as boolean} onChange={(v) => onChange(category.id, v)} />
        )}
        {category.inputType === 'hours' && (
          <HoursInput value={value as number} onChange={(v) => onChange(category.id, v)} />
        )}
      </View>
    </View>
  );
});

// ─── Flow ────────────────────────────────────────────────────────────────────

const FLOW_OPTIONS: { value: FlowValue; label: string }[] = [
  { value: 'spotting', label: 'Spot' },
  { value: 'light',    label: 'Light' },
  { value: 'medium',   label: 'Med' },
  { value: 'heavy',    label: 'Heavy' },
  { value: 'very_heavy', label: 'Very' },
];

function FlowInput({ value, onChange }: { value: FlowValue | undefined; onChange: (v: FlowValue) => void }) {
  return (
    <View style={styles.chipRow}>
      {FLOW_OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Scale ───────────────────────────────────────────────────────────────────

function ScaleInput({ value, onChange }: { value: ScaleValue | undefined; onChange: (v: ScaleValue) => void }) {
  return (
    <View style={styles.scaleRow}>
      {([1, 2, 3, 4, 5] as ScaleValue[]).map((n) => (
        <TouchableOpacity
          key={n}
          style={[styles.scaleDot, (value ?? 0) >= n && styles.scaleDotActive]}
          onPress={() => onChange(n)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === n }}
          accessibilityLabel={`${n} out of 5`}
        />
      ))}
    </View>
  );
}

// ─── Mood ────────────────────────────────────────────────────────────────────

const MOOD_OPTIONS: { value: MoodValue; emoji: string }[] = [
  { value: 'great', emoji: '😄' },
  { value: 'good',  emoji: '🙂' },
  { value: 'okay',  emoji: '😐' },
  { value: 'low',   emoji: '😔' },
  { value: 'bad',   emoji: '😢' },
];

function MoodInput({ value, onChange }: { value: MoodValue | undefined; onChange: (v: MoodValue) => void }) {
  return (
    <View style={styles.chipRow}>
      {MOOD_OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[styles.emojiChip, selected && styles.chipSelected]}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={o.value}
          >
            <Text style={styles.emojiText}>{o.emoji}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Boolean ─────────────────────────────────────────────────────────────────

function BooleanInput({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean) => void }) {
  const isOn = value === true;
  return (
    <TouchableOpacity
      style={[styles.toggleChip, isOn && styles.chipSelected]}
      onPress={() => onChange(!isOn)}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOn }}
    >
      <Text style={[styles.chipText, isOn && styles.chipTextSelected]}>
        {isOn ? 'Yes' : 'No'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Hours ───────────────────────────────────────────────────────────────────

function HoursInput({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  const hours = value ?? 7;
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(0, hours - 0.5))}
        accessibilityLabel="decrease hours"
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{hours}h</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(24, hours + 0.5))}
        accessibilityLabel="increase hours"
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  icon: {
    fontSize: 18,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  control: {
    flexShrink: 0,
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.periodConfirmed + '18',
    borderColor: colors.periodConfirmed,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.periodConfirmed,
  },
  emojiChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emojiText: {
    fontSize: 18,
  },
  toggleChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Scale
  scaleRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  scaleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  scaleDotActive: {
    backgroundColor: colors.periodConfirmed,
  },
  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 22,
  },
  stepValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
});
