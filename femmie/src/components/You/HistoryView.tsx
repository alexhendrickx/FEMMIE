import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Agenda } from '../Agenda';
import { todayISO } from '../CycleCalendar/utils';
import { useLogStore } from '../../store/logStore';
import { colors } from '../../theme/colors';

interface HistoryViewProps {
  /** Open the daily flow for a tapped day. */
  onDayLog?: (date: string) => void;
}

/**
 * You → History: the shared <Agenda> on its own (UX decision #6 "Google-Calendar
 * style") — one chronological, whole-date-coloured list of cycle days. Personal
 * patterns and the cycle recap now live in their own You → Insights surface.
 */
export function HistoryView({ onDayLog }: HistoryViewProps) {
  const logs = useLogStore((s) => s.logs);
  const logList = useMemo(() => Object.values(logs), [logs]);

  return (
    <View style={styles.container}>
      <Agenda logs={logList} today={todayISO()} onDayPress={onDayLog} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
