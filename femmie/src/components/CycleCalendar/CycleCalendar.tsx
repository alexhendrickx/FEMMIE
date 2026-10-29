import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, type PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { MonthView } from './MonthView';
import { YearView } from './YearView';
import { DaySheet } from './DaySheet';
import { colors } from '../../theme/colors';
import type { DayData, MonthRef } from '../../types/calendar';

interface CycleCalendarProps {
  days: DayData[];
  onDayLog?: (date: string) => void;
}

export function CycleCalendar({ days, onDayLog }: CycleCalendarProps) {
  const [view, setView] = useState<'month' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState<MonthRef>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Pinch in (scale < 0.75) → switch to year view
  const handlePinch = useCallback(
    (event: PinchGestureHandlerGestureEvent) => {
      if (view === 'month' && event.nativeEvent.scale < 0.75) {
        setView('year');
      }
    },
    [view],
  );

  const handleMonthSelect = useCallback((year: number, month: number) => {
    setCurrentMonth({ year, month });
    setView('month');
  }, []);

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const selectedDayData = selectedDate
    ? (days.find((d) => d.date === selectedDate) ?? null)
    : null;

  return (
    // GestureHandlerRootView must be at the app root in production;
    // wrapping here keeps the component self-contained for isolated use.
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        {view === 'month' ? (
          <PinchGestureHandler onGestureEvent={handlePinch}>
            <View style={styles.fill}>
              <MonthView
                days={days}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onDayPress={handleDayPress}
              />
            </View>
          </PinchGestureHandler>
        ) : (
          <YearView
            days={days}
            year={currentMonth.year}
            onMonthSelect={handleMonthSelect}
          />
        )}
      </View>

      <DaySheet
        date={selectedDate}
        dayData={selectedDayData}
        onClose={handleSheetClose}
        onLog={onDayLog}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
});
