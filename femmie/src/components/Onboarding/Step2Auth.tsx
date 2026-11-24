import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

// Guarded import: the native Apple module is unavailable in Node (tests) and on
// non-iOS platforms. A failed require must not blow up importing this screen.
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  AppleAuthentication = require('expo-apple-authentication');
} catch {
  AppleAuthentication = null;
}

// Apple Sign-In is wired but kept off until the entitlement + Supabase Apple
// provider are configured (via an EAS build). Flip to true to enable the button.
const APPLE_SIGNIN_ENABLED = false;

interface Props {
  onNext: () => void;
}

export function Step2Auth({ onNext }: Props) {
  const { register, login, loginWithApple } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    if (APPLE_SIGNIN_ENABLED && Platform.OS === 'ios' && AppleAuthentication) {
      void AppleAuthentication.isAvailableAsync()
        .then((available) => {
          if (active) setAppleAvailable(available);
        })
        .catch(() => {
          if (active) setAppleAvailable(false);
        });
    }
    return () => {
      active = false;
    };
  }, []);

  const handleAuthSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        await register(email, password);
      } else {
        await login(email, password);
      }
      // The encryption key is initialised silently in AuthContext.
      onNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!AppleAuthentication) return;
    setLoading(true);
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('Apple sign-in did not return an identity token');
      }
      await loginWithApple(credential.identityToken);
      onNext();
    } catch (err) {
      // Ignore the user-cancelled case; surface anything else.
      if (
        err instanceof Error &&
        (err as { code?: string }).code === 'ERR_REQUEST_CANCELED'
      ) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.body}>
          Your identity for syncing. Your data stays encrypted.
        </Text>
      </View>

      <View style={styles.middle}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleAuthSubmit}
          disabled={loading || !email || !password}
          accessibilityRole="button"
          accessibilityLabel={mode === 'register' ? 'Create account' : 'Sign in'}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.btnText}>{mode === 'register' ? 'Create account →' : 'Sign in →'}</Text>
          )}
        </TouchableOpacity>

        {appleAvailable && (
          <TouchableOpacity
            style={[styles.appleBtn, loading && styles.btnDisabled]}
            onPress={handleAppleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Apple"
          >
            <Text style={styles.appleBtnText}> Sign in with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setMode(mode === 'register' ? 'login' : 'register')}
          accessibilityRole="button"
          accessibilityLabel={mode === 'register' ? 'Switch to sign in' : 'Switch to create account'}
        >
          <Text style={styles.switchText}>
            {mode === 'register' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>We never see your password or your data.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: 'space-between' },
  top: { marginTop: 24 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 12 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  middle: { gap: 12 },
  bottom: { gap: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  errorText: { fontSize: 13, color: colors.danger, textAlign: 'center' },
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
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
  appleBtn: {
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  appleBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
  switchText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  footnote: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
