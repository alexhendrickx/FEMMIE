import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DRSP_MAX, type CycleSeverity } from '../../types/mood';
import { formatSeverity } from '../../lib/moodForm';
import { colors } from '../../theme/colors';

interface MoodSeverityCardProps {
  cycles: CycleSeverity[];
  hasStarts: boolean;
  hasEntries: boolean;
}

export function MoodSeverityCard({ cycles, hasStarts, hasEntries }: MoodSeverityCardProps) {
  if (!hasEntries) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No records yet</Text>
        <Text style={styles.emptyHint}>
          Each daily record is kept on your device only. Severity by cycle appears here once you have logged a few days.
        </Text>
      </View>
    );
  }
  if (!hasStarts) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No cycle to group by</Text>
        <Text style={styles.emptyHint}>Log a period start to see severity by cycle.</Text>
      </View>
    );
  }
  if (cycles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No records inside a tracked cycle</Text>
        <Text style={styles.emptyHint}>Records before your first logged period start are not grouped.</Text>
      </View>
    );
  }
  return (
    <View style={styles.block}>
      <Text style={styles.heading}>SEVERITY BY CYCLE</Text>
      <View style={styles.card}>
        {cycles.map((c) => (
          <View key={c.cycleId} style={styles.row}>
            <Text style={styles.rowLeft}>Cycle from {c.cycleId}</Text>
            <Text style={styles.rowRight}>
              {formatSeverity(c.meanSeverity)} / {DRSP_MAX} · {c.entryCount} {c.entryCount === 1 ? 'day' : 'days'}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>Mean of your daily DRSP means within each cycle. Cycles come from your logged period starts.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 12 },
  heading: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLeft: { fontSize: 15, color: colors.text, flexShrink: 1 },
  rowRight: { fontSize: 14, color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textMuted },
  empty: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
