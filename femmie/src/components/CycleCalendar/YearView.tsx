import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { buildMonthGrid, monthLabel, todayISO, WEEKDAYS } from './utils';
import { colors } from '../../theme/colors';
import type { DayData, MonthRef } from '../../types/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MINI_WIDTH = (SCREEN_WIDTH - 48) / 2; // 2-column grid with padding
const MINI_CELL = Math.floor(MINI_WIDTH / 7);
const MINI_DOT = Math.max(MINI_CELL - 2, 6);

interface YearViewProps {
  days: DayData[];
  year: number;
  onMonthSelect: (year: number, month: number) => void;
}

export function YearView({ days, year, onMonthSelect }: YearViewProps) {
  const months: MonthRef[] = Array.from({ length: 12 }, (_, i) => ({
    year,
    month: i,
  }));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.yearLabel}>{year}</Text>
      {months.map((ref) => (
        <MiniMonth
          key={ref.month}
          monthRef={ref}
          days={days}
          onPress={() => onMonthSelect(ref.year, ref.month)}
        />
      ))}
    </ScrollView>
  );
}

interface MiniMonthProps {
  monthRef: MonthRef;
  days: DayData[];
  onPress: () => void;
}

const MiniMonth = memo(function MiniMonth({ monthRef, days, onPress }: MiniMonthProps) {
  const grid = buildMonthGrid(monthRef, days);
  const today = todayISO();

  const label = new Date(monthRef.year, monthRef.month, 1).toLocaleString('default', {
    month: 'long',
  });

  return (
    <TouchableOpacity
      style={[styles.miniCard, { width: MINI_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${monthRef.year}, tap to open`}
    >
      <Text style={styles.miniMonthLabel}>{label}</Text>

      {/* Mini weekday headers */}
      <View style={styles.miniWeekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.miniWeekday, { width: MINI_CELL }]}>
            {d[0]}
          </Text>
        ))}
      </View>

      {/* Mini day grid */}
      {Array.from({ length: 6 }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.miniRow}>
          {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell) => (
            <MiniDayCell
              key={cell.date}
              date={cell.date}
              day={cell.day}
              state={cell.state}
              isToday={cell.isToday}
              isCurrentMonth={cell.isCurrentMonth}
              size={MINI_DOT}
            />
          ))}
        </View>
      ))}
    </TouchableOpacity>
  );
});

interface MiniDayCellProps {
  date: string;
  day: number;
  state: import('../../types/calendar').DayState;
  isToday: boolean;
  isCurrentMonth: boolean;
  size: number;
}

function MiniDayCell({ day, state, isToday, isCurrentMonth, size }: MiniDayCellProps) {
  const r = size / 2;

  const textColor = !isCurrentMonth
    ? colors.textMuted
    : state === 'confirmed'
    ? colors.textLight
    : state === 'predicted'
    ? colors.periodPredicted
    : isToday
    ? colors.textLight
    : colors.text;

  const showConfirmed = state === 'confirmed';
  const showPredicted = state === 'predicted';
  const showToday = isToday && state !== 'confirmed';

  return (
    <View style={[styles.miniCell, { width: MINI_CELL, height: MINI_CELL }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {showConfirmed && (
          <Circle cx={r} cy={r} r={r - 0.5} fill={colors.periodConfirmed} />
        )}
        {showPredicted && (
          <Circle
            cx={r} cy={r} r={r - 1}
            fill="none"
            stroke={colors.periodPredicted}
            strokeWidth={1}
            strokeDasharray="2,1.5"
          />
        )}
        {showToday && (
          <Circle cx={r} cy={r} r={r - 0.5} fill={colors.today} />
        )}
      </Svg>
      <Text
        style={[styles.miniDayText, { color: textColor }]}
        allowFontScaling={false}
      >
        {day}
      </Text>
      {state === 'fertile' && <View style={styles.miniFertileDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  yearLabel: {
    width: '100%',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    paddingVertical: 16,
  },
  miniCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  miniMonthLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  miniWeekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  miniWeekday: {
    textAlign: 'center',
    fontSize: 7,
    fontWeight: '600',
    color: colors.textMuted,
  },
  miniRow: {
    flexDirection: 'row',
  },
  miniCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniDayText: {
    fontSize: 7,
    fontWeight: '500',
  },
  miniFertileDot: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.fertile,
  },
});
