import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HistoryView } from './HistoryView';
import { InsightsScreen } from '../Insights';
import { HealthIntegrationScreen } from '../HealthIntegration/HealthIntegrationScreen';
import { PrivacyScreen } from '../PrivacyScreen';
import { SettingsScreen } from './SettingsScreen';
import { colors } from '../../theme/colors';

type YouView = 'list' | 'history' | 'insights' | 'health' | 'privacy' | 'settings';

interface YouSheetProps {
  visible: boolean;
  onClose: () => void;
  onCalendarDayLog: () => void;
}

const ROW_DEFS: { id: Exclude<YouView, 'list'>; icon: string; label: string }[] = [
  { id: 'history', icon: '📅', label: 'History' },
  { id: 'insights', icon: '💡', label: 'Insights' },
  { id: 'health', icon: '❤️', label: 'Health' },
  { id: 'privacy', icon: '🔒', label: 'Privacy' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

const TITLES: Record<YouView, string> = {
  list: 'You',
  history: 'History',
  insights: 'Insights',
  health: 'Health',
  privacy: 'Privacy',
  settings: 'Settings',
};

export function YouSheet({ visible, onClose, onCalendarDayLog }: YouSheetProps) {
  const [view, setView] = useState<YouView>('list');

  const handleClose = () => {
    setView('list');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          {view !== 'list' ? (
            <TouchableOpacity
              onPress={() => setView('list')}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={styles.headerAction}>‹ Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.headerTitle}>{TITLES[view]}</Text>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.headerAction}>×</Text>
          </TouchableOpacity>
        </View>

        {view === 'list' && (
          <ScrollView style={styles.list}>
            {ROW_DEFS.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={styles.row}
                onPress={() => setView(row.id)}
                accessibilityRole="button"
                accessibilityLabel={row.label}
              >
                <Text style={styles.rowIcon}>{row.icon}</Text>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {view === 'history' && <HistoryView onDayLog={onCalendarDayLog} />}
        {view === 'insights' && <InsightsScreen />}
        {view === 'health' && <HealthIntegrationScreen />}
        {view === 'privacy' && <PrivacyScreen />}
        {view === 'settings' && <SettingsScreen />}
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
  headerAction: { fontSize: 16, fontWeight: '600', color: colors.periodConfirmed },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text },
  rowChevron: { fontSize: 20, color: colors.textMuted },
});
