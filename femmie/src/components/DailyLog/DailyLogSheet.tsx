import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryRow } from './CategoryRow';
import { ShortcutBar } from './ShortcutBar';
import { getVisibleCategories } from '../../data/categories';
import { useLogStore } from '../../store/logStore';
import { colors } from '../../theme/colors';
import type { EntryValue, LogEntry } from '../../types/logging';

interface DailyLogSheetProps {
  visible: boolean;
  date: string;         // YYYY-MM-DD
  cycleDay: number;
  /** Ordered category IDs from GET /logs/suggestions?cycleDay=N */
  suggestedCategoryIds?: string[];
  onClose: () => void;
  onSaved?: (date: string) => void;
}

export function DailyLogSheet({
  visible,
  date,
  cycleDay,
  suggestedCategoryIds = [],
  onClose,
  onSaved,
}: DailyLogSheetProps) {
  const { getLog, saveLog, shortcuts } = useLogStore();
  const existingLog = getLog(date);
  const isEdit = Boolean(existingLog);

  // Build initial entry map from existing log (if editing)
  const [entries, setEntries] = useState<Map<string, EntryValue>>(() =>
    new Map(existingLog?.entries.map((e) => [e.categoryId, e.value]) ?? []),
  );
  const [showAll, setShowAll] = useState(false);

  // Re-sync when sheet opens for a new date
  useEffect(() => {
    if (visible) {
      setEntries(new Map(existingLog?.entries.map((e) => [e.categoryId, e.value]) ?? []));
      setShowAll(false);
    }
  }, [visible, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback((categoryId: string, value: EntryValue) => {
    setEntries((prev) => new Map(prev).set(categoryId, value));
  }, []);

  const handleApplyShortcut = useCallback((shortcutEntries: LogEntry[]) => {
    setEntries((prev) => {
      const next = new Map(prev);
      shortcutEntries.forEach((e) => next.set(e.categoryId, e.value));
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const logEntries: LogEntry[] = Array.from(entries.entries()).map(([categoryId, value]) => ({
      categoryId,
      value,
    }));
    saveLog({ date, cycleDay, entries: logEntries });
    onSaved?.(date);
    onClose();
  }, [date, cycleDay, entries, saveLog, onSaved, onClose]);

  const visibleCategories = getVisibleCategories(cycleDay, suggestedCategoryIds, showAll);
  const hasEntries = entries.size > 0;

  // ── Animation ──────────────────────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
      }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{isEdit ? 'Edit today' : 'Log today'}</Text>
            <Text style={styles.subtitle}>{formattedDate}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Close"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Shortcuts */}
        <ShortcutBar shortcuts={shortcuts} onApply={handleApplyShortcut} />

        {/* Category list */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {visibleCategories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              value={entries.get(cat.id)}
              onChange={handleChange}
            />
          ))}

          {/* Show all toggle */}
          <TouchableOpacity
            style={styles.showAllBtn}
            onPress={() => setShowAll((prev) => !prev)}
            accessibilityRole="button"
          >
            <Text style={styles.showAllText}>
              {showAll ? 'Show fewer' : 'Show all categories'}
            </Text>
          </TouchableOpacity>

          <View style={styles.scrollPad} />
        </ScrollView>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, !hasEntries && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasEntries}
          accessibilityRole="button"
          accessibilityLabel={isEdit ? 'Save changes' : 'Save log'}
        >
          <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : 'Save log'}</Text>
        </TouchableOpacity>
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
    height: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.sheetHandle,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    marginTop: 4,
  },
  scrollPad: {
    height: 100,
  },
  showAllBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.fertile,
  },
  saveBtn: {
    position: 'absolute',
    bottom: 36,
    left: 20,
    right: 20,
    backgroundColor: colors.periodConfirmed,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: colors.periodConfirmed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
