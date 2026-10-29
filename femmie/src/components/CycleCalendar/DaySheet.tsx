import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors } from '../../theme/colors';
import type { DayData } from '../../types/calendar';

const STATE_LABELS: Record<string, string> = {
  confirmed: 'Period day',
  predicted: 'Predicted period',
  fertile: 'Fertile window',
};

const STATE_COLORS: Record<string, string> = {
  confirmed: colors.periodConfirmed,
  predicted: colors.periodPredicted,
  fertile: colors.fertile,
};

interface DaySheetProps {
  date: string | null;
  dayData: DayData | null;
  onClose: () => void;
  onLog?: (date: string) => void;
}

export function DaySheet({ date, dayData, onClose, onLog }: DaySheetProps) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const visible = date !== null;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  if (!date) return null;

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const state = dayData?.state ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed backdrop */}
      <Pressable style={styles.overlay} onPress={onClose} />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Date header */}
        <Text style={styles.dateLabel}>{formattedDate}</Text>

        {/* Cycle state badge */}
        {state && (
          <View style={[styles.badge, { backgroundColor: STATE_COLORS[state] + '22' }]}>
            <View style={[styles.badgeDot, { backgroundColor: STATE_COLORS[state] }]} />
            <Text style={[styles.badgeText, { color: STATE_COLORS[state] }]}>
              {STATE_LABELS[state]}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              onLog?.(date);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel={state ? 'Edit log for this day' : 'Log this day'}
          >
            <Text style={styles.primaryButtonText}>
              {state ? 'Edit log' : 'Log this day'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sheetHandle,
    alignSelf: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 24,
    gap: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.periodConfirmed,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
