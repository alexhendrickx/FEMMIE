import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryRow } from './CategoryRow';
import { ShortcutBar } from './ShortcutBar';
import { getVisibleCategories } from '../../data/categories';
import { filterCategories, groupCategories } from '../../lib/logSheet';
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
  const [search, setSearch] = useState('');

  // Re-sync when sheet opens for a new date
  useEffect(() => {
    if (visible) {
      setEntries(new Map(existingLog?.entries.map((e) => [e.categoryId, e.value]) ?? []));
      setSearch('');
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

  // Visible categories (period-window rule lives in getVisibleCategories), then
  // filter by the search query and split into ordered, titled sections.
  const sections = useMemo(() => {
    const visible = getVisibleCategories(cycleDay, suggestedCategoryIds, true);
    return groupCategories(filterCategories(visible, search));
  }, [cycleDay, suggestedCategoryIds, search]);

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

  const d = new Date(date + 'T00:00:00');
  // e.g. "May 22, Fri"
  const formattedDate = `${d.toLocaleDateString('default', { month: 'short' })} ${d.getDate()}, ${d.toLocaleDateString(
    'default',
    { weekday: 'short' },
  )}`;

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

        {/* Centered date header */}
        <View style={styles.header}>
          <Text style={styles.title}>{formattedDate}</Text>
          <Text style={styles.subtitle}>Cycle day {cycleDay}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            accessibilityLabel="Search categories"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.searchClear}
              accessibilityLabel="Clear search"
            >
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Shortcuts */}
        <ShortcutBar shortcuts={shortcuts} onApply={handleApplyShortcut} />

        {/* Grouped category sections */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {sections.length === 0 ? (
            <Text style={styles.emptyText}>No categories match “{search.trim()}”.</Text>
          ) : (
            sections.map((section) => (
              <View key={section.group} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    category={cat}
                    value={entries.get(cat.id)}
                    onChange={handleChange}
                  />
                ))}
              </View>
            ))
          )}

          <View style={styles.scrollPad} />
        </ScrollView>

        {/* Cancel / Save */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.cancelBtn]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerBtn, styles.saveBtn, !hasEntries && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasEntries}
            accessibilityRole="button"
            accessibilityLabel={isEdit ? 'Save changes' : 'Save log'}
          >
            <Text style={styles.saveBtnText}>{isEdit ? 'Save changes' : 'Save'}</Text>
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
    height: '88%',
    backgroundColor: colors.background,
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
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  searchClear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    fontSize: 11,
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
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 32,
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.periodConfirmed,
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
