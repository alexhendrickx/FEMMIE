import React, { useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Agenda } from '../Agenda';
import { todayISO } from '../CycleCalendar/utils';
import { useLogStore } from '../../store/logStore';
import { colors } from '../../theme/colors';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  /** Tapping a day — e.g. jump into the daily flow for it. */
  onDayLog?: (date: string) => void;
}

/**
 * The cycle Calendar reached by tapping the Home ring. A full-screen peek at the whole
 * cycle on the shared <Agenda> — the same component You → History renders — so Today
 * stays the calm root and the detail is one tap away (app-vision "two destinations").
 */
export function CalendarModal({ visible, onClose, onDayLog }: CalendarModalProps) {
  const logs = useLogStore((s) => s.logs);
  const logList = useMemo(() => Object.values(logs), [logs]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Calendar</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text style={styles.headerAction}>×</Text>
          </TouchableOpacity>
        </View>
        <Agenda logs={logList} today={todayISO()} onDayPress={onDayLog} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerSpacer: { width: 44 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerAction: { fontSize: 24, fontWeight: '600', color: colors.periodConfirmed },
});
