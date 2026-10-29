import React, { memo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { DayCircle, type CircleVariant } from './DayCircle';
import { colors } from '../../theme/colors';
import type { DayState } from '../../types/calendar';

interface DayCellProps {
  date: string;
  day: number;
  state: DayState;
  isToday: boolean;
  isCurrentMonth: boolean;
  onPress: (date: string) => void;
}

function resolveVariant(state: DayState, isToday: boolean): CircleVariant {
  if (state === 'confirmed') return isToday ? 'confirmed-today' : 'confirmed';
  if (state === 'predicted') return 'predicted';
  if (isToday) return 'today';
  return 'none';
}

export const DayCell = memo(function DayCell({
  date,
  day,
  state,
  isToday,
  isCurrentMonth,
  onPress,
}: DayCellProps) {
  const variant = resolveVariant(state, isToday);
  const hasCircle = variant !== 'none';
  const onDark = variant === 'confirmed' || variant === 'confirmed-today' || variant === 'today';

  const textColor = !isCurrentMonth
    ? colors.textMuted
    : onDark
    ? colors.textLight
    : state === 'predicted'
    ? colors.periodPredicted
    : colors.text;

  return (
    <TouchableOpacity
      style={styles.cell}
      onPress={() => onPress(date)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${date}${state ? `, ${state} period day` : ''}${isToday ? ', today' : ''}`}
    >
      {hasCircle ? (
        <DayCircle variant={variant} size={36}>
          <Text style={[styles.dayText, { color: textColor }]}>{day}</Text>
        </DayCircle>
      ) : (
        <View style={styles.plain}>
          <Text style={[styles.dayText, { color: textColor }]}>{day}</Text>
        </View>
      )}

      {/* Fertile accent dot below the number */}
      {state === 'fertile' && <View style={styles.fertileDot} />}

      {/* Today indicator dot when day also has a confirmed circle */}
      {isToday && variant === 'confirmed-today' && <View style={styles.todayDot} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 48,
  },
  plain: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
  },
  fertileDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.fertile,
    marginTop: 2,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textLight,
    marginTop: 2,
  },
});
