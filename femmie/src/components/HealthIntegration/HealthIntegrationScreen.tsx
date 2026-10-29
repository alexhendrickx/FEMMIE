import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { DataTypeRow } from './DataTypeRow';
import { AuditLog } from './AuditLog';
import { READ_TYPES, WRITE_TYPES } from '../../health/dataTypes';
import { requestPermissions, syncReadType, platformLabel } from '../../health/healthBridge';
import { useHealthStore } from '../../store/healthStore';
import { colors } from '../../theme/colors';

export function HealthIntegrationScreen() {
  const {
    permissionStatus,
    lastSyncAt,
    auditLog,
    setPermissionStatus,
    togglePaused,
    isPaused,
    recordSyncEvent,
    clearAuditLog,
  } = useHealthStore();

  const [requesting, setRequesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ── Permission request ─────────────────────────────────────────────────────
  const handleRequestPermissions = useCallback(async () => {
    setRequesting(true);
    const status = await requestPermissions();
    setPermissionStatus(status);
    setRequesting(false);

    if (status === 'granted') {
      runSync();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync all active read types ─────────────────────────────────────────────
  const runSync = useCallback(async () => {
    if (permissionStatus !== 'granted') return;
    setSyncing(true);
    const now = new Date().toISOString();

    await Promise.all(
      READ_TYPES.map(async (dt) => {
        if (isPaused(dt.id)) {
          recordSyncEvent({ timestamp: now, dataTypeId: dt.id, direction: 'read', status: 'skipped' });
          return;
        }
        const result = await syncReadType(dt.id);
        recordSyncEvent({
          timestamp: now,
          dataTypeId: dt.id,
          direction: 'read',
          status: result ? 'success' : 'error',
          errorMessage: result ? undefined : 'No data returned',
        });
      }),
    );

    setSyncing(false);
  }, [permissionStatus, isPaused, recordSyncEvent]);

  // Auto-sync on mount if already granted
  useEffect(() => {
    if (permissionStatus === 'granted') runSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = useCallback(
    (id: string, _enabled: boolean) => togglePaused(id),
    [togglePaused],
  );

  // ── UI states ──────────────────────────────────────────────────────────────
  const isUnavailable = permissionStatus === 'unavailable';
  const isDenied = permissionStatus === 'denied';
  const isNotDetermined = permissionStatus === 'not_determined';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Health & Fitness</Text>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{platformLabel}</Text>
          </View>
        </View>
        {permissionStatus === 'granted' && (
          <TouchableOpacity
            style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}
            onPress={runSync}
            disabled={syncing}
          >
            {syncing
              ? <ActivityIndicator size="small" color={colors.textLight} />
              : <Text style={styles.syncBtnText}>Sync now</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {/* Permission banner */}
      {(isNotDetermined || isDenied || isUnavailable) && (
        <View style={[styles.banner, isUnavailable && styles.bannerUnavailable]}>
          <Text style={styles.bannerTitle}>
            {isUnavailable
              ? `${platformLabel} not available`
              : isDenied
              ? 'Permission denied'
              : `Connect ${platformLabel}`}
          </Text>
          <Text style={styles.bannerBody}>
            {isUnavailable
              ? Platform.OS === 'android'
                ? 'Health Connect requires Android 9+ with the Health Connect app installed.'
                : 'HealthKit is not available on this device.'
              : isDenied
              ? `Go to Settings › Privacy › Health to allow Femmie to access ${platformLabel}.`
              : `Allow Femmie to read health data and write cycle events to ${platformLabel}.`}
          </Text>
          {!isUnavailable && (
            <TouchableOpacity
              style={styles.grantBtn}
              onPress={handleRequestPermissions}
              disabled={requesting}
            >
              {requesting
                ? <ActivityIndicator size="small" color={colors.periodConfirmed} />
                : <Text style={styles.grantBtnText}>
                    {isDenied ? 'Open Settings' : 'Grant access'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Reading from Health */}
      <Section title={`Reading from ${platformLabel}`}>
        {READ_TYPES.map((dt) => (
          <DataTypeRow
            key={dt.id}
            dataType={dt}
            lastSyncAt={lastSyncAt[dt.id]}
            paused={isPaused(dt.id)}
            onToggle={handleToggle}
          />
        ))}
      </Section>

      {/* Writing to Health */}
      <Section title={`Writing to ${platformLabel}`}>
        {WRITE_TYPES.map((dt) => (
          <DataTypeRow
            key={dt.id}
            dataType={dt}
            lastSyncAt={lastSyncAt[dt.id]}
            paused={isPaused(dt.id)}
            onToggle={handleToggle}
          />
        ))}
      </Section>

      {/* Audit log */}
      <Section
        title="Sync activity"
        action={
          auditLog.length > 0
            ? { label: 'Clear', onPress: clearAuditLog }
            : undefined
        }
      >
        <AuditLog events={auditLog} />
      </Section>
    </ScrollView>
  );
}

// ─── Section ────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: { label: string; onPress: () => void };
}

function Section({ title, children, action }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={styles.sectionAction}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  platformBadge: {
    marginTop: 4,
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  platformText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  syncBtn: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 84,
    alignItems: 'center',
  },
  syncBtnDisabled: {
    opacity: 0.6,
  },
  syncBtnText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  // Banner
  banner: {
    backgroundColor: colors.fertile + '15',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.fertile + '30',
  },
  bannerUnavailable: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  bannerBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  grantBtn: {
    borderWidth: 1.5,
    borderColor: colors.periodConfirmed,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  grantBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.periodConfirmed,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fertile,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
