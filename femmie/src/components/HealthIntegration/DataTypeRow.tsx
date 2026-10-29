import React, { memo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import type { HealthDataType } from '../../types/health';

interface DataTypeRowProps {
  dataType: HealthDataType;
  lastSyncAt: string | undefined;
  paused: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}

function relativeTime(iso: string | undefined): string {
  if (!iso) return 'Never synced';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const DataTypeRow = memo(function DataTypeRow({
  dataType,
  lastSyncAt,
  paused,
  onToggle,
}: DataTypeRowProps) {
  const isRead = dataType.direction === 'read';

  return (
    <View style={styles.row}>
      {/* Icon + label */}
      <View style={styles.left}>
        <Text style={styles.icon}>{dataType.icon}</Text>
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{dataType.label}</Text>
            <View style={[styles.dirBadge, isRead ? styles.dirRead : styles.dirWrite]}>
              <Text style={[styles.dirText, isRead ? styles.dirTextRead : styles.dirTextWrite]}>
                {isRead ? '↓ read' : '↑ write'}
              </Text>
            </View>
          </View>
          <Text style={styles.lastSync}>{relativeTime(lastSyncAt)}</Text>
        </View>
      </View>

      {/* Toggle */}
      <Switch
        value={!paused}
        onValueChange={(enabled) => onToggle(dataType.id, enabled)}
        trackColor={{ false: colors.border, true: colors.periodConfirmed + '60' }}
        thumbColor={!paused ? colors.periodConfirmed : colors.textMuted}
        accessibilityRole="switch"
        accessibilityLabel={`${paused ? 'Enable' : 'Disable'} ${dataType.label} sync`}
        accessibilityState={{ checked: !paused }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dirBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  dirRead: {
    backgroundColor: colors.fertile + '20',
  },
  dirWrite: {
    backgroundColor: colors.periodConfirmed + '18',
  },
  dirText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dirTextRead: {
    color: colors.fertile,
  },
  dirTextWrite: {
    color: colors.periodConfirmed,
  },
  lastSync: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
