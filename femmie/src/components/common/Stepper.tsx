import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  total: number;
  current: number; // 1-based
  onBack?: () => void;
}

export function Stepper({ total, current, onBack }: Props) {
  const showBack = Boolean(onBack) && current > 1;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.label}>
          Step {current} of {total}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i < current - 1 ? styles.segmentFilled : styles.segmentUnfilled]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // SafeAreaView already applies the top inset; keep only a small standard gap
    // below it so the progress bar sits high on screen (iOS convention).
    paddingTop: 8,
    paddingHorizontal: 24,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  segmentFilled: {
    backgroundColor: colors.periodConfirmed,
  },
  segmentUnfilled: {
    backgroundColor: colors.border,
  },
});
