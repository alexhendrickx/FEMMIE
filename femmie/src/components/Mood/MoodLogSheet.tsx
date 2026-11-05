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
import {
  DRSP_ITEMS,
  DRSP_SCALE_STEPS,
  DRSP_SCALE_LABEL,
  emptyDraft,
  setDraftScore,
  draftToEntry,
  canSaveDraft,
  remainingItems,
  type DrspDraft,
} from '../../lib/moodForm';
import { DRSP_MIN, DRSP_MAX } from '../../types/mood';
import { useMoodStore } from '../../store/moodStore';
import { colors } from '../../theme/colors';

interface MoodLogSheetProps {
  visible: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onSaved?: () => void;
}

export function MoodLogSheet({ visible, date, onClose, onSaved }: MoodLogSheetProps) {
  const existing = useMoodStore((s) => s.entries[date]);
  const saveEntry = useMoodStore((s) => s.saveEntry);
  const [draft, setDraft] = useState<DrspDraft>(() => emptyDraft(date, existing));
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) setDraft(emptyDraft(date, existing));
  }, [visible, date, existing]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible, slideAnim]);

  const handleSave = useCallback(() => {
    const entry = draftToEntry(draft);
    if (!entry) return;
    if (saveEntry(entry)) {
      onSaved?.();
      onClose();
    }
  }, [draft, saveEntry, onSaved, onClose]);

  if (!visible) return null;

  const d = new Date(date + 'T00:00:00');
  // e.g. "Mar 4, Wed"
  const formattedDate = `${d.toLocaleDateString('default', { month: 'short' })} ${d.getDate()}, ${d.toLocaleDateString(
    'default',
    { weekday: 'short' },
  )}`;
  const remaining = remainingItems(draft);

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Daily record</Text>
          <Text style={styles.subtitle}>{formattedDate}</Text>
        </View>

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.sectionCard}>
            <Text style={styles.hint}>
              Rate how much each problem affected you today. {DRSP_MIN} = not at all · {DRSP_MAX} = extreme. This is a record, not a diagnosis.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>TODAY'S ITEMS</Text>
            {DRSP_ITEMS.map((item, index) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <View style={styles.numberRow}>
                  {DRSP_SCALE_STEPS.map((n) => {
                    const selected = draft.scores[index] === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[styles.numberBtn, selected && styles.numberBtnActive]}
                        onPress={() => setDraft((prev) => setDraftScore(prev, index, n))}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${item.label}: ${n}, ${DRSP_SCALE_LABEL[n]}`}>
                        <Text style={[styles.numberText, selected && styles.numberTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
          <View style={styles.scrollPad} />
        </ScrollView>

        <View style={styles.footer}>
          {remaining > 0 && (
            <Text style={styles.footerHint}>
              {remaining} {remaining === 1 ? 'item' : 'items'} left to rate
            </Text>
          )}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerBtn, styles.saveBtn, !canSaveDraft(draft) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSaveDraft(draft)}
              accessibilityLabel="Save daily record">
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '88%', backgroundColor: colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 0, shadowColor: colors.text, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.sheetHandle, alignSelf: 'center', marginBottom: 16 },
  header: { alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  scroll: { flex: 1, marginTop: 4 },
  scrollPad: { height: 120 },
  sectionCard: { backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  itemRow: { gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemLabel: { fontSize: 15, color: colors.text },
  numberRow: { flexDirection: 'row', justifyContent: 'space-between' },
  numberBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  numberBtnActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  numberText: { fontSize: 14, fontWeight: '600', color: colors.text },
  numberTextActive: { color: colors.textLight },
  footer: { position: 'absolute', bottom: 36, left: 20, right: 20, gap: 8 },
  footerHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  footerButtons: { flexDirection: 'row', gap: 12 },
  footerBtn: { flex: 1, borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  saveBtn: { backgroundColor: colors.periodConfirmed, shadowColor: colors.periodConfirmed, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  saveBtnText: { color: colors.textLight, fontSize: 16, fontWeight: '700' },
});
