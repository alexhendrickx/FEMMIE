import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

interface Props {
  onNext: () => void;
}

export function Step2Passkey({ onNext }: Props) {
  const { register, login, hasPasskey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      if (hasPasskey) {
        await login();
      } else {
        await register();
      }
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.step}>Step 2 of 3</Text>
        <Text style={styles.title}>
          {hasPasskey ? 'Welcome back' : 'Set up your passkey'}
        </Text>
        <Text style={styles.body}>
          {hasPasskey
            ? "Confirm it's you with Face ID or fingerprint to continue."
            : 'Femmie uses your device\'s biometric security instead of a password. Your login key never leaves this phone.'}
        </Text>
      </View>

      <View style={styles.middle}>
        <View style={styles.biometricBox}>
          <Text style={styles.biometricIcon}>
            {hasPasskey ? '🔓' : '🔒'}
          </Text>
          <Text style={styles.biometricLabel}>
            {hasPasskey ? 'Face ID / Fingerprint' : 'Secured by your device'}
          </Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSetup}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={hasPasskey ? 'Sign in with passkey' : 'Create passkey'}
      >
        {loading ? (
          <ActivityIndicator color={colors.textLight} />
        ) : (
          <Text style={styles.btnText}>
            {hasPasskey ? 'Sign in →' : 'Create passkey →'}
          </Text>
        )}
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
  step: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  middle: {
    alignItems: 'center',
    gap: 16,
  },
  biometricBox: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  biometricIcon: {
    fontSize: 40,
  },
  biometricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
    textAlign: 'center',
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
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
