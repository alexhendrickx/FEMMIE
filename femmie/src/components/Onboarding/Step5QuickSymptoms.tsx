import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { QuickSymptomPicker } from '../QuickSymptoms';

interface Props {
  initial?: string[];
  onDone: (quickSymptomIds: string[]) => void;
}

export function Step5QuickSymptoms({ initial = [], onDone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>What do you want to track?</Text>
        <Text style={styles.body}>
          Pick a few things to check each day. These become your one-tap buttons, and you can change them anytime.
        </Text>
      </View>
      <QuickSymptomPicker initial={initial} ctaLabel="Start tracking →" onDone={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10, lineHeight: 32 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
