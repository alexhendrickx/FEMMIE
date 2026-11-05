import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MoodSafeguard } from '../../types/mood';
import { colors } from '../../theme/colors';

interface MoodSafeguardCardProps {
  safeguard: MoodSafeguard;
  onDismiss: () => void;
}

// HUMAN-VERIFY: clinical-liability copy. Keep supportive and non-diagnostic.
export function MoodSafeguardCard({ safeguard, onDismiss }: MoodSafeguardCardProps) {
  if (!safeguard.triggered) return null;
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>A pattern worth mentioning</Text>
      <Text style={styles.body}>{safeguard.basis}</Text>
      <Text style={styles.body}>
        This is a record, not a diagnosis. Only a clinician can assess what these scores mean for you — you may want to bring this record to your next appointment.
      </Text>
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Don't show this again">
        <Text style={styles.dismissText}>Don't show this again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  dismissBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  dismissText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
