import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/colors';

export type CircleVariant = 'confirmed' | 'predicted' | 'today' | 'confirmed-today' | 'none';

interface DayCircleProps {
  variant: CircleVariant;
  size?: number;
  children: React.ReactNode;
}

export function DayCircle({ variant, size = 36, children }: DayCircleProps) {
  const r = size / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {variant === 'confirmed' && (
          <Circle cx={r} cy={r} r={r - 1} fill={colors.periodConfirmed} />
        )}
        {variant === 'confirmed-today' && (
          <Circle cx={r} cy={r} r={r - 1} fill={colors.periodConfirmed} />
        )}
        {variant === 'predicted' && (
          <Circle
            cx={r}
            cy={r}
            r={r - 2}
            fill="none"
            stroke={colors.periodPredicted}
            strokeWidth={1.5}
            strokeDasharray="3,2.5"
          />
        )}
        {variant === 'today' && (
          <Circle cx={r} cy={r} r={r - 1} fill={colors.today} />
        )}
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
