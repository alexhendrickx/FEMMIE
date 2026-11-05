import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

const MIN_LENGTH = 21;
const MAX_LENGTH = 35;

interface Props {
  initial?: number;
  onDone: (cycleLength: number) => void;
}

export function Step4CycleLength({ initial = 28, onDone }: Props) {
  const [length, setLength] = useState(initial);

  const dec = () => setLength((v) => Math.max(MIN_LENGTH, v - 1));
  const inc = () => setLength((v) => Math.min(MAX_LENGTH, v + 1));

  // Position of the current value along the track (for the fill + thumb hint).
  const pct = ((length - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>How long is your cycle?</Text>
        <Text style={styles.body}>
          The number of days from one period to the next. Most are 24 to 32. You can change this later.
        </Text>
      </View>

      <View style={styles.picker}>
        <Text style={styles.bigNumber}>{length}</Text>
        <Text style={styles.unit}>days</Text>

        {/* Visual track (decorative) */}
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${pct}%` }]} />
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleEnd}>{MIN_LENGTH}</Text>
          <Text style={styles.scaleEnd}>{MAX_LENGTH}</Text>
        </View>

        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={dec}
            disabled={length <= MIN_LENGTH}
            style={[styles.stepBtn, length <= MIN_LENGTH && styles.stepBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Shorter cycle"
          >
            <Text style={styles.stepBtnText}>–</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={inc}
            disabled={length >= MAX_LENGTH}
            style={[styles.stepBtn, length >= MAX_LENGTH && styles.stepBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Longer cycle"
          >
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => onDone(length)}
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  top: { marginTop: 24, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 10, lineHeight: 32 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

  picker: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
  },
  bigNumber: { fontSize: 64, fontWeight: '800', color: colors.periodConfirmed },
  unit: { fontSize: 15, color: colors.textMuted, marginTop: -4, marginBottom: 20 },

  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: colors.periodConfirmed },
  scaleRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleEnd: { fontSize: 12, color: colors.textMuted },

  stepperRow: { flexDirection: 'row', gap: 20, marginTop: 24 },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.periodConfirmed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: { borderColor: colors.border },
  stepBtnText: { fontSize: 28, color: colors.periodConfirmed, fontWeight: '600', lineHeight: 30 },

  btn: {
    marginTop: 'auto',
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
});
