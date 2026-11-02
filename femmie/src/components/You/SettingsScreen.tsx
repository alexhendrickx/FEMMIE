import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export function SettingsScreen() {
  const { hasPasskey, isOffline, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Text style={styles.line}>
          {hasPasskey ? 'Signed in with a passkey' : 'Signed in'}
        </Text>
        {isOffline && <Text style={styles.hint}>Offline — changes will sync later</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={[styles.row, styles.rowDisabled]}>
          <Text style={styles.rowLabel}>Reminders</Text>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => { void logout(); }}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 24 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  line: { fontSize: 15, color: colors.text },
  hint: { fontSize: 13, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowDisabled: { opacity: 0.5 },
  rowLabel: { fontSize: 15, color: colors.text },
  comingSoon: { fontSize: 13, color: colors.textMuted },
  logoutButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.periodConfirmed },
});
