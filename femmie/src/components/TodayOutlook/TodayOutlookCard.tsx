import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLogStore } from '../../store/logStore';
import { todayOutlook } from '../../lib/outlook';
import { buildOutlookCard } from '../../lib/outlookCard';
import { todayISO } from '../CycleCalendar/utils';
import { colors } from '../../theme/colors';

/**
 * Home → "Today's outlook" (F2-08): what the user's OWN past cycles tend to show around this
 * cycle day. Computed on-device from decrypted logs in the store; never population data,
 * never prescriptive. Hidden entirely when the user mutes phase content in Settings.
 */
export function TodayOutlookCard() {
  const logs = useLogStore((s) => s.logs);
  const muted = useLogStore((s) => s.phaseContentMuted);

  const model = useMemo(
    () => buildOutlookCard(todayOutlook(Object.values(logs), todayISO()), muted),
    [logs, muted],
  );

  if (model.kind === 'hidden') return null;

  return (
    <View style={styles.card} accessibilityRole="summary" accessibilityLabel="Today's outlook">
      <Text style={styles.title}>{model.title}</Text>

      {model.kind === 'placeholder' ? (
        <Text style={styles.body}>{model.body}</Text>
      ) : (
        <>
          <Text style={styles.headline}>{model.headline}</Text>
          {model.observations.map((o) => (
            <View key={o.key} style={styles.observationRow}>
              <View style={styles.bullet} />
              <Text style={styles.observation}>{o.text}</Text>
            </View>
          ))}
          {model.suggestion !== null && (
            <Text style={styles.suggestion}>{model.suggestion}</Text>
          )}
        </>
      )}

      {model.footer !== null && <Text style={styles.footer}>{model.footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headline: { fontSize: 16, fontWeight: '700', color: colors.text },
  observationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.fertile,
  },
  observation: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  suggestion: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  footer: { fontSize: 12, color: colors.textMuted },
});
