/**
 * Drop this into your app screen to see the calendar in action.
 * Replace SAMPLE_DAYS with real data from your API.
 */
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CycleCalendar } from './index';
import type { DayData } from '../../types/calendar';

const SAMPLE_DAYS: DayData[] = [
  // Confirmed period days
  { date: '2026-05-01', state: 'confirmed' },
  { date: '2026-05-02', state: 'confirmed' },
  { date: '2026-05-03', state: 'confirmed' },
  { date: '2026-05-04', state: 'confirmed' },
  { date: '2026-05-05', state: 'confirmed' },
  // Predicted fertile window
  { date: '2026-05-14', state: 'fertile' },
  { date: '2026-05-15', state: 'fertile' },
  { date: '2026-05-16', state: 'fertile' },
  { date: '2026-05-17', state: 'fertile' },
  // Predicted next period
  { date: '2026-05-29', state: 'predicted' },
  { date: '2026-05-30', state: 'predicted' },
  { date: '2026-05-31', state: 'predicted' },
  { date: '2026-06-01', state: 'predicted' },
  { date: '2026-06-02', state: 'predicted' },
];

export default function HomeScreen() {
  const handleDayLog = (date: string) => {
    console.log('Open log sheet for:', date);
    // → navigate to your logging screen or open a form
  };

  return (
    <SafeAreaView style={styles.safe}>
      <CycleCalendar days={SAMPLE_DAYS} onDayLog={handleDayLog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
