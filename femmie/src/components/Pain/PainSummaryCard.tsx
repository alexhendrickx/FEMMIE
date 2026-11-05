import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PainSummary } from '../../lib/pain';
import { PHASE_LABEL, REGION_LABEL } from '../../lib/painForm';
import { colors } from '../../theme/colors';
import type { CyclePhase } from '../../types/cycle';

const PHASE_ORDER: CyclePhase[] = ['period', 'follicular', 'fertile', 'luteal'];

interface PainSummaryCardProps {
  summary: PainSummary;
}

/** Pure presentation of a `painSummary` result. All numbers come from `lib/pain.ts`. */
export function PainSummaryCard({ summary }: PainSummaryCardProps) {
  if (summary.totalEvents === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No pain episodes yet</Text>
        <Text style={styles.emptyHint}>
          Log an episode and the summary builds here — on your device, never shared.
        </Text>
      </View>
    );
  }

  const noPhaseData = PHASE_ORDER.every((p) => summary.byPhase[p].count === 0);

  return (
    <View style={styles.block}>
      <Text style={styles.heading}>SUMMARY</Text>
      <View style={styles.recapCard}>
        <Text style={styles.recapLength}>
          {summary.totalEvents} {summary.totalEvents === 1 ? 'episode' : 'episodes'}
          <Text style={styles.recapAvg}>  ·  avg intensity {summary.avgIntensity}/10</Text>
        </Text>
        {summary.dateRange && (
          <Text style={styles.recapRange}>
            {summary.dateRange.from} to {summary.dateRange.to}
          </Text>
        )}
      </View>

      <Text style={styles.heading}>MOST REPORTED LOCATIONS</Text>
      <View style={styles.card}>
        {summary.topLocations.map((l) => (
          <View key={l.region} style={styles.row}>
            <Text style={styles.rowLeft}>{REGION_LABEL[l.region]}</Text>
            <Text style={styles.rowRight}>×{l.count}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.heading}>AVERAGE INTENSITY BY PHASE</Text>
      <View style={styles.card}>
        {PHASE_ORDER.map((phase) => {
          const { avgIntensity, count } = summary.byPhase[phase];
          return (
            <View key={phase} style={styles.row}>
              <Text style={styles.rowLeft}>{PHASE_LABEL[phase]}</Text>
              <Text style={styles.rowRight}>
                {count > 0
                  ? `${avgIntensity}/10 · ${count} ${count === 1 ? 'episode' : 'episodes'}`
                  : '—'}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {noPhaseData
          ? 'Log a period start to see intensity by phase.'
          : 'Phases come from your logged period starts.'}
      </Text>

      {summary.medications.length > 0 && (
        <>
          <Text style={styles.heading}>MEDICATIONS</Text>
          <View style={styles.card}>
            {summary.medications.map((m) => (
              <View key={m.name} style={styles.row}>
                <Text style={styles.rowLeft}>{m.name}</Text>
                <Text style={styles.rowRight}>
                  {m.avgEffectiveness}/5 · tried {m.timesTried}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  recapRange: { fontSize: 14, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: { fontSize: 15, color: colors.text, flexShrink: 1 },
  rowRight: { fontSize: 14, color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textMuted },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptyHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
