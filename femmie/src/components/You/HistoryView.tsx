import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Agenda } from '../Agenda';
import { todayISO } from '../CycleCalendar/utils';
import { useLogStore } from '../../store/logStore';
import { surfaceCorrelations } from '../../lib/correlation';
import { generateRecap } from '../../lib/recap';
import { colors } from '../../theme/colors';

interface HistoryViewProps {
  /** Open the daily flow for a tapped day. */
  onDayLog?: (date: string) => void;
}

/**
 * You → History, rebuilt on the shared <Agenda> (UX decision #6 "Google-Calendar
 * style"): one chronological, whole-date-coloured list of cycle days instead of the
 * old Week/Month/List toggle. Patterns (F2-07/F2-12) ride along as the agenda footer
 * for now — Phase C lifts them into a dedicated Insights surface.
 */
export function HistoryView({ onDayLog }: HistoryViewProps) {
  const logs = useLogStore((s) => s.logs);
  const logList = useMemo(() => Object.values(logs), [logs]);

  return (
    <View style={styles.container}>
      <Agenda
        logs={logList}
        today={todayISO()}
        onDayPress={onDayLog}
        footer={<PatternsSection />}
      />
    </View>
  );
}

/**
 * "Your patterns" — the second of the two slots where Phase-2 intelligence surfaces
 * (the first is the end-of-flow insight). A one-line recap of the last completed cycle
 * plus the patterns the correlation engine is confident about (F2-07/F2-12). Nothing
 * prescriptive; the user can dismiss any pattern as "not relevant".
 */
function PatternsSection() {
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
    <View style={styles.patterns}>
      <Text style={styles.patternsHeading}>Your patterns</Text>

      {recap && (
        <View style={styles.recapLine}>
          <Text style={styles.recapText}>
            Last cycle: {recap.cycleLength} days (avg {recap.avgCycleLength})
            {recap.topSymptoms.length > 0 &&
              ` · top: ${recap.topSymptoms.map((s) => s.symptomName).join(', ')}`}
          </Text>
        </View>
      )}

      {patterns.length === 0 ? (
        <Text style={styles.patternsEmpty}>
          Keep logging — personal patterns appear after about 3 cycles.
        </Text>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Your patterns (F2-07 / F2-12)
  patterns: { paddingHorizontal: 16, paddingTop: 24, gap: 12 },
  patternsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recapLine: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  recapText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  patternsEmpty: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
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
});
