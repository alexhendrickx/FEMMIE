import React, { memo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { DATA_TYPE_MAP } from '../../health/dataTypes';
import type { SyncEvent } from '../../types/health';

interface AuditLogProps {
  events: SyncEvent[];
}

const STATUS_COLOR: Record<string, string> = {
  success:          '#4CAF80',
  skipped:          colors.textMuted,
  error:            '#E57373',
  permission_denied: '#FF9800',
};

const STATUS_LABEL: Record<string, string> = {
  success:          'Synced',
  skipped:          'Skipped',
  error:            'Error',
  permission_denied: 'No permission',
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('default', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AuditLog = memo(function AuditLog({ events }: AuditLogProps) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No sync activity yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(e) => e.id}
      scrollEnabled={false}
      renderItem={({ item }) => <AuditRow event={item} />}
    />
  );
});

function AuditRow({ event }: { event: SyncEvent }) {
  const dataType = DATA_TYPE_MAP.get(event.dataTypeId);
  const color = STATUS_COLOR[event.status] ?? colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.icon}>{dataType?.icon ?? '📊'}</Text>
        <View>
          <Text style={styles.label}>
            {dataType?.label ?? event.dataTypeId}
            {'  '}
            <Text style={styles.dir}>
              {event.direction === 'read' ? '↓' : '↑'}
            </Text>
          </Text>
          {event.errorMessage ? (
            <Text style={[styles.meta, { color }]}>{event.errorMessage}</Text>
          ) : (
            <Text style={styles.meta}>{formatTimestamp(event.timestamp)}</Text>
          )}
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[event.status]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  dir: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
