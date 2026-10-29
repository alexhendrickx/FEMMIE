import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { DayCell } from './DayCell';
import { buildMonthGrid, monthLabel, prevMonth, nextMonth, WEEKDAYS } from './utils';
import { colors } from '../../theme/colors';
import type { DayData, MonthRef } from '../../types/calendar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MonthViewProps {
  days: DayData[];
  currentMonth: MonthRef;
  onMonthChange: (ref: MonthRef) => void;
  onDayPress: (date: string) => void;
}

export function MonthView({ days, currentMonth, onMonthChange, onDayPress }: MonthViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  // Track whether the scroll was triggered by us (month change) or the user
  const isResetting = useRef(false);

  // Always snap back to center page after currentMonth changes
  useEffect(() => {
    isResetting.current = true;
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: false });
    // Allow user interaction again after layout settles
    const t = setTimeout(() => { isResetting.current = false; }, 80);
    return () => clearTimeout(t);
  }, [currentMonth]);

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isResetting.current) return;
      const x = e.nativeEvent.contentOffset.x;
      if (x < SCREEN_WIDTH * 0.5) {
        onMonthChange(prevMonth(currentMonth));
      } else if (x > SCREEN_WIDTH * 1.5) {
        onMonthChange(nextMonth(currentMonth));
      }
    },
    [currentMonth, onMonthChange],
  );

  const months: MonthRef[] = [prevMonth(currentMonth), currentMonth, nextMonth(currentMonth)];

  return (
    <View style={styles.container}>
      {/* Month header */}
      <Text style={styles.monthLabel}>{monthLabel(currentMonth)}</Text>

      {/* Weekday headers */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {/* Horizontally paged months */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {months.map((ref) => (
          <MonthGrid
            key={`${ref.year}-${ref.month}`}
            monthRef={ref}
            days={days}
            onDayPress={onDayPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface MonthGridProps {
  monthRef: MonthRef;
  days: DayData[];
  onDayPress: (date: string) => void;
}

function MonthGrid({ monthRef, days, onDayPress }: MonthGridProps) {
  const grid = buildMonthGrid(monthRef, days);

  return (
    <View style={[styles.grid, { width: SCREEN_WIDTH }]}>
      {Array.from({ length: 6 }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell) => (
            <DayCell
              key={cell.date}
              date={cell.date}
              day={cell.day}
              state={cell.state}
              isToday={cell.isToday}
              isCurrentMonth={cell.isCurrentMonth}
              onPress={onDayPress}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingBottom: 8,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 12,
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
  },
});
