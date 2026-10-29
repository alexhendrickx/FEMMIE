import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WipeConfirmSheet } from './WipeConfirmSheet';
import { wipeLocal } from '../../services/encryption';
import { wipeDatabase } from '../../services/sqlite';
import { useEncryptionStore } from '../../store/encryptionStore';
import { colors } from '../../theme/colors';
import type { WipeMode } from '../../types/encryption';

// Replace with your actual API base + auth token logic
const API_BASE = 'https://api.femmie.app';

export function PrivacyScreen() {
  const {
    cloudSyncEnabled,
    syncStatus,
    lastSyncAt,
    keyReady,
    setCloudSync,
    requestWipe,
  } = useEncryptionStore();

  const [wipeSheetOpen, setWipeSheetOpen] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleToggleSync = useCallback(
    (enabled: boolean) => setCloudSync(enabled),
    [setCloudSync],
  );

  const handleWipeConfirm = useCallback(
    async (mode: WipeMode) => {
      setWipeSheetOpen(false);
      setWiping(true);
      requestWipe(mode);

      // 1. Destroy local data + key
      await wipeLocal();
      await wipeDatabase();

      // 2. Notify backend (fire-and-forget — local is already gone)
      fetch(`${API_BASE}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gracePeriod: mode === 'soft' }),
      }).catch(() => {}); // If offline, backend will catch it on next login attempt

      setWiping(false);
      // Navigate away — app should show onboarding/empty state
    },
    [requestWipe],
  );

  const syncLabel =
    syncStatus === 'synced' && lastSyncAt
      ? `Last synced ${new Date(lastSyncAt).toLocaleString('default', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      : syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'error'
      ? 'Sync error — will retry'
      : 'Data lives on this device only';

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
        <InfoRow icon="🩸" label="Cycle logs" desc="Period dates, flow, symptoms, mood — everything you log." />
        <InfoRow icon="❤️" label="Health signals" desc="Sleep, HRV, and heart rate pulled from Apple Health or Health Connect (only if you allow it)." />
        <InfoRow icon="⚙️" label="App settings" desc="Notification preferences, category ordering, shortcuts." />
        <InfoRow icon="🔑" label="Encryption key (wrapped)" desc="Your personal data key, locked by your device's secure enclave. We cannot read it." />
      </Section>

      {/* Where it lives */}
      <Section title="Where it lives">
        <InfoRow
          icon="📱"
          label="On this device"
          desc="All data is stored locally in an encrypted SQLite database. Nothing leaves your phone unless you turn on cloud sync."
        />
        <InfoRow
          icon="☁️"
          label="Cloud sync (optional)"
          desc="If you enable sync, your encrypted data is uploaded to our servers. We store the ciphertext only — we cannot decrypt it."
        />

        <View style={styles.syncRow}>
          <View style={styles.syncLeft}>
            <Text style={styles.syncLabel}>Cloud backup</Text>
            <Text style={styles.syncSub}>{syncLabel}</Text>
          </View>
          <Switch
            value={cloudSyncEnabled}
            onValueChange={handleToggleSync}
            trackColor={{ false: colors.border, true: colors.fertile + '60' }}
            thumbColor={cloudSyncEnabled ? colors.fertile : colors.textMuted}
            accessibilityLabel="Enable cloud backup"
          />
        </View>

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
          <Text style={styles.bold}>If we receive a legal request</Text> (subpoena, court order) for
          your data, we can only hand over encrypted blobs. We do not hold your decryption key —
          it lives only on your device.
          {'\n\n'}
          We publish an annual transparency report listing the number and jurisdiction of all
          government data requests we receive.
          {'\n\n'}
          If cloud sync is off, there is nothing on our servers to hand over.
        </Text>
      </Section>

      {/* Wipe */}
      <Section title="Delete your data">
        <Text style={styles.wipeText}>
          You can remove all your data from this device and our servers at any time. This includes
          your entire cycle history, health logs, and account.
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
        onConfirm={handleWipeConfirm}
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
  // Sync row
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  syncLeft: {
    flex: 1,
    marginRight: 12,
  },
  syncLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  syncSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
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
    borderColor: '#E57373',
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
    color: '#C62828',
  },
});
