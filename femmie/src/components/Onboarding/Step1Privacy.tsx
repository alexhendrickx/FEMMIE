import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  onNext: () => void;
}

const PROMISES = [
  { icon: '🔑', text: 'Your data is encrypted on your device. Only you can read it.' },
  { icon: '🚫', text: 'No ads, no data brokers, no selling your health data. Ever.' },
  { icon: '🗑️', text: 'Delete everything — device and servers — with one tap, any time.' },
];

export function Step1Privacy({ onNext }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.eyebrow}>Welcome to</Text>
        <Text style={styles.title}>Femmie</Text>
        <Text style={styles.subtitle}>This is your space. Private by design.</Text>
      </View>

      <View style={styles.promises}>
        {PROMISES.map(({ icon, text }) => (
          <View key={icon} style={styles.row}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.rowText}>{text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.btnText}>Sounds good →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    justifyContent: 'space-between',
  },
  top: {
    marginTop: 24,
  },
  eyebrow: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  promises: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginTop: 1,
  },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.periodConfirmed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
