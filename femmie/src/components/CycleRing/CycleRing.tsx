import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';
import type { CyclePhase } from '../../types/cycle';

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASE_COLOR: Record<CyclePhase, string> = {
  period: colors.periodConfirmed,
  follicular: colors.today,
  fertile: colors.fertile,
  luteal: colors.textSecondary,
};

const PHASE_LABEL: Record<CyclePhase, string> = {
  period: 'Period',
  follicular: 'Follicular',
  fertile: 'Fertile window',
  luteal: 'Luteal',
};

interface CycleRingProps {
  cycleDay: number | null;
  phase: CyclePhase | null;
  progress: number; // 0..1 fraction of the cycle elapsed
  onPress: () => void;
}

export function CycleRing({ cycleDay, phase, progress, onPress }: CycleRingProps) {
  const arcColor = phase ? PHASE_COLOR[phase] : colors.border;
  const clamped = Math.max(0, Math.min(1, progress));
  const dashOffset = CIRCUMFERENCE * (1 - clamped);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open today's log"
      style={styles.wrapper}
    >
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        {cycleDay !== null && (
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={arcColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            originX={SIZE / 2}
            originY={SIZE / 2}
          />
        )}
      </Svg>
      <View style={styles.centerOverlay} pointerEvents="none">
        <Text style={styles.cycleDay}>{cycleDay !== null ? cycleDay : '—'}</Text>
        <Text style={styles.phaseLabel}>
          {phase ? PHASE_LABEL[phase] : 'No data yet'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleDay: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
});
