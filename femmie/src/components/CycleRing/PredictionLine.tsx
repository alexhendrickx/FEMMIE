import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import type { Prediction } from '../../types/cycle';

export type CycleSummaryState = 'empty' | 'low' | 'normal' | 'overdue';

interface PredictionLineProps {
  state: CycleSummaryState;
  prediction: Prediction;
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export function PredictionLine({ state, prediction }: PredictionLineProps) {
  if (state === 'empty') {
    return <Text style={styles.line}>Log your period to see predictions</Text>;
  }

  if (state === 'low') {
    return <Text style={styles.line}>Low confidence — keep logging</Text>;
  }

  // 'normal' and 'overdue' are only reached when predictNextPeriod returned a window
  // (>= 2 cycles, confidence not 'low') — windowStart/windowEnd/mostLikely are guaranteed set.
  const rangeLabel = `${formatShortDate(prediction.windowStart as string)}–${formatShortDate(prediction.windowEnd as string)}`;

  if (state === 'overdue') {
    return (
      <View>
        <Text style={[styles.line, styles.muted]}>Period may be late</Text>
        <Text style={styles.subLine}>{rangeLabel}</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.line}>Next period ~ {formatShortDate(prediction.mostLikely as string)}</Text>
      <Text style={styles.subLine}>{rangeLabel}</Text>
      <Text style={styles.basis}>{prediction.basis}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
  subLine: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  basis: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
