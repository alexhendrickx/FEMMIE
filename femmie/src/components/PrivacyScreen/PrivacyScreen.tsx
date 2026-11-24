import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WipeConfirmSheet } from './WipeConfirmSheet';
import { AccountDeletionError, deleteAccountAndData } from '../../services/accountDeletion';
import { useEncryptionStore } from '../../store/encryptionStore';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export function PrivacyScreen() {
  const { session } = useAuth();
  const keyReady = useEncryptionStore((s) => s.keyReady);

  const [wipeSheetOpen, setWipeSheetOpen] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleWipeConfirm = useCallback(async () => {
    setWipeSheetOpen(false);
    setWiping(true);
    const signedIn = session !== null;
    try {
      await deleteAccountAndData(signedIn);
    } catch (e) {
      if (e instanceof AccountDeletionError) {
        Alert.alert(
          'Nothing was deleted',
          "We couldn't reach the server to delete your account. Check your connection and try again.",
        );
      } else {
        Alert.alert(
          signedIn ? 'Account deleted' : 'Not everything was deleted',
          `${signedIn ? 'Your account is gone, but some' : 'Some'} data on this phone couldn't be removed. Delete the Femmie app to remove it.`,
        );
      }
    } finally {
      setWiping(false);
    }
  }, [session]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.title}>Your privacy</Text>
      <Text style={styles.intro}>
        Femmie is built around one principle: your data belongs to you. Here's exactly what we
        store, where it lives, and how to remove it.
      </Text>

      {/* What we store */}
      <Section title="What Femmie stores">
        <InfoRow icon="🩸" label="Cycle logs" desc="Period dates, flow, symptoms, mood: everything you log." />
        <InfoRow icon="❤️" label="Health signals" desc="Sleep, HRV, and heart rate from Apple Health or Health Connect, only if you allow it." />
        <InfoRow icon="⚙️" label="App settings" desc="Notification and display preferences." />
        <InfoRow icon="🔑" label="Encryption key" desc="Your personal data key, kept in the iOS Keychain on this phone. We never receive it." />
      </Section>

      {/* Where it lives */}
      <Section title="Where it lives">
        <InfoRow
          icon="📱"
          label="On this phone, encrypted"
          desc="Everything you log is stored on this phone, encrypted with your key. Nothing is uploaded."
        />
        <InfoRow
          icon="☁️"
          label="Backup"
          desc="Coming soon. When you turn it on, only encrypted data will leave your phone."
        />

        {/* Encryption status pill */}
        <View style={[styles.pill, keyReady ? styles.pillGreen : styles.pillGrey]}>
          <Text style={styles.pillText}>
            {keyReady ? '🔒 Encryption active' : '⚠️ Encryption key not loaded'}
          </Text>
        </View>
      </Section>

      {/* Legal access */}
      <Section title="Legal access to your data">
        <Text style={styles.legalText}>
          <Text style={styles.bold}>If we receive a legal request</Text> (subpoena, court order),
          there is nothing on our servers to hand over. Your logs and your key exist only on this
          phone.
        </Text>
      </Section>

      {/* Wipe */}
      <Section title="Delete your data">
        <Text style={styles.wipeText}>
          You can remove everything at any time: your cycle history, health logs, settings and, if
          you have one, your account.
        </Text>
        <TouchableOpacity
          style={[styles.wipeBtn, wiping && styles.wipeBtnDisabled]}
          onPress={() => setWipeSheetOpen(true)}
          disabled={wiping}
          accessibilityRole="button"
          accessibilityLabel="Delete all my data"
        >
          <Text style={styles.wipeBtnText}>{wiping ? 'Deleting…' : 'Delete all my data'}</Text>
        </TouchableOpacity>
      </Section>

      <WipeConfirmSheet
        visible={wipeSheetOpen}
        onConfirm={() => void handleWipeConfirm()}
        onCancel={() => setWipeSheetOpen(false)}
      />
    </ScrollView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  intro: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 28,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillGreen: {
    backgroundColor: '#4CAF8020',
  },
  pillGrey: {
    backgroundColor: colors.border,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  // Legal
  legalText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  // Wipe
  wipeText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  wipeBtn: {
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  wipeBtnDisabled: {
    opacity: 0.5,
  },
  wipeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});
