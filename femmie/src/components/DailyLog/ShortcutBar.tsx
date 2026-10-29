import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { ShortcutCombo, LogEntry } from '../../types/logging';

interface ShortcutBarProps {
  shortcuts: ShortcutCombo[];
  onApply: (entries: LogEntry[]) => void;
}

export function ShortcutBar({ shortcuts, onApply }: ShortcutBarProps) {
  if (shortcuts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Quick log</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {shortcuts.map((sc) => (
          <TouchableOpacity
            key={sc.id}
            style={styles.pill}
            onPress={() => onApply(sc.entries)}
            accessibilityRole="button"
            accessibilityLabel={`Quick log: ${sc.label}`}
          >
            <Text style={styles.pillText} numberOfLines={1}>
              {sc.label}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{sc.usageCount}×</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  scroll: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.periodConfirmed + '12',
    borderWidth: 1,
    borderColor: colors.periodConfirmed + '30',
    maxWidth: 220,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.periodConfirmed,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.periodConfirmed + '25',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.periodConfirmed,
  },
});
