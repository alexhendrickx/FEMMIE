import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { QuickSymptomPicker } from '../QuickSymptoms';
import { DEFAULT_QUICK_SYMPTOM_IDS } from '../../lib/quickSymptoms';

interface Props {
  initial?: string[];
  onDone: (quickSymptomIds: string[]) => void;
}

export function Step5QuickSymptoms({ initial = DEFAULT_QUICK_SYMPTOM_IDS, onDone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.step}>Step 5 of 5</Text>
        <Text style={styles.title}>Pick your daily check-ins</Text>
        <Text style={styles.body}>
          Choose 5–8 things you want to keep an eye on. These become your one-tap buttons in
          the daily flow — you can change them anytime.
        </Text>
      </View>
      <QuickSymptomPicker initial={initial} ctaLabel="Start tracking →" onDone={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  step: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10, lineHeight: 32 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
