import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import {
  groupedPickableSymptoms,
  isValidSelection,
  toggleSymptom,
  MIN_QUICK_SYMPTOMS,
  MAX_QUICK_SYMPTOMS,
  sanitizeSelection,
} from '../../lib/quickSymptoms';

interface Props {
  /** Currently-pinned symptom ids (sanitised on mount). */
  initial: string[];
  /** Label for the confirm button, e.g. "Start tracking →" or "Save". */
  ctaLabel: string;
  onDone: (ids: string[]) => void;
}

const GROUPS = groupedPickableSymptoms();

/**
 * Pick your personal 5–8 quick symptoms, shown by category with a one-line explanation
 * each (UX decisions #2, #14, #17). Pure UI over ../../lib/quickSymptoms — all the rules
 * (what's offerable, grouping, the 5–8 bounds) live in that tested module.
 */
export function QuickSymptomPicker({ initial, ctaLabel, onDone }: Props) {
  const [selected, setSelected] = useState<string[]>(() => sanitizeSelection(initial));

  const count = selected.length;
  const valid = isValidSelection(selected);
  const atMax = count >= MAX_QUICK_SYMPTOMS;

  const hint = !valid
    ? count < MIN_QUICK_SYMPTOMS
      ? `Pick at least ${MIN_QUICK_SYMPTOMS} to check each day.`
      : `Up to ${MAX_QUICK_SYMPTOMS}. Tap one to swap it out.`
    : `${count} of up to ${MAX_QUICK_SYMPTOMS} chosen.`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {GROUPS.map((group) => (
          <View key={group.group} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.label}</Text>
            {group.items.map((cat) => {
              const active = selected.includes(cat.id);
              const disabled = !active && atMax;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelected((s) => toggleSymptom(s, cat.id))}
                  disabled={disabled}
                  style={[
                    styles.item,
                    active && styles.itemActive,
                    disabled && styles.itemDisabled,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active, disabled }}
                  accessibilityLabel={cat.label}
                  accessibilityHint={cat.explain}
                >
                  <Text style={styles.itemIcon}>{cat.icon}</Text>
                  <View style={styles.itemText}>
                    <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                      {cat.label}
                    </Text>
                    {cat.explain ? <Text style={styles.itemExplain}>{cat.explain}</Text> : null}
                  </View>
                  <View style={[styles.check, active && styles.checkActive]}>
                    {active ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.hint}>{hint}</Text>
        <Pressable
          style={[styles.cta, !valid && styles.ctaDisabled]}
          disabled={!valid}
          onPress={() => onDone(selected)}
          accessibilityRole="button"
          accessibilityState={{ disabled: !valid }}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 12, gap: 20 },
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemActive: { borderColor: colors.periodConfirmed, backgroundColor: colors.fertileAccent },
  itemDisabled: { opacity: 0.4 },
  itemIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemLabelActive: { color: colors.text },
  itemExplain: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 17 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  checkMark: { color: colors.textLight, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: 12,
  },
  hint: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  cta: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: colors.border },
  ctaText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
});
