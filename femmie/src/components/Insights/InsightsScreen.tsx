import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLogStore } from '../../store/logStore';
import { surfaceCorrelations } from '../../lib/correlation';
import { generateRecap } from '../../lib/recap';
import { colors } from '../../theme/colors';

/**
 * You → Insights: the dedicated home for Phase-2 personal intelligence (one of the two
 * slots the app-vision reserves for it; the other is the end-of-flow insight). A recap
 * of the last completed cycle (F2-12) plus the patterns the correlation engine is
 * confident about (F2-07). Everything is computed ON-DEVICE from the user's own
 * decrypted logs — never population data, never prescriptive — and any pattern can be
 * dismissed as "not relevant". Keeping this separate lets History stay a clean agenda.
 */
export function InsightsScreen() {
  const logs = useLogStore((s) => s.logs);
  const feedback = useLogStore((s) => s.correlationFeedback);
  const setFeedback = useLogStore((s) => s.setCorrelationFeedback);

  const logList = useMemo(() => Object.values(logs), [logs]);
  const recap = useMemo(() => generateRecap(logList, feedback), [logList, feedback]);
  const patterns = useMemo(
    () => surfaceCorrelations(logList, feedback),
    [logList, feedback],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {recap && (
        <View style={styles.block}>
          <Text style={styles.heading}>Last cycle</Text>
          <View style={styles.recapCard}>
            <Text style={styles.recapLength}>
              {recap.cycleLength} days
              <Text style={styles.recapAvg}>  ·  avg {recap.avgCycleLength}</Text>
            </Text>
            {recap.topSymptoms.length > 0 && (
              <Text style={styles.recapTop}>
                Top: {recap.topSymptoms.map((s) => s.symptomName).join(', ')}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.heading}>Your patterns</Text>
        {patterns.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💡</Text>
            <Text style={styles.emptyText}>Patterns appear after about 3 cycles</Text>
            <Text style={styles.emptyHint}>
              Keep logging and Femmie will spot how your symptoms line up with your cycle —
              on your device, never shared.
            </Text>
          </View>
        ) : (
          patterns.map((c) => (
            <View key={c.symptomId} style={styles.patternCard}>
              <Text style={styles.patternText}>{c.pattern}</Text>
              <View style={styles.patternActions}>
                <TouchableOpacity
                  style={styles.patternBtn}
                  onPress={() => setFeedback(c.symptomId, true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark pattern about ${c.symptomName} as helpful`}
                >
                  <Text style={styles.patternBtnText}>Helpful</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.patternBtn}
                  onPress={() => setFeedback(c.symptomId, false)}
                  accessibilityRole="button"
                  accessibilityLabel={`Hide pattern about ${c.symptomName}`}
                >
                  <Text style={styles.patternBtnText}>Not relevant</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 24 },

  block: { gap: 12 },
  heading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  recapCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  recapLength: { fontSize: 22, fontWeight: '700', color: colors.text },
  recapAvg: { fontSize: 15, fontWeight: '500', color: colors.textMuted },
  recapTop: { fontSize: 14, color: colors.textSecondary },

  patternCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  patternText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  patternActions: { flexDirection: 'row', gap: 10 },
  patternBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patternBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
