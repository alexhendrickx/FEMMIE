import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { BODY_REGIONS } from '../../types/pain';
import {
  REGION_LABEL,
  DURATION_OPTIONS,
  INTENSITY_STEPS,
  EFFECTIVENESS_STEPS,
  emptyDraft,
  toggleRegion,
  draftToEvent,
  canSaveDraft,
  type PainDraft,
} from '../../lib/painForm';
import { usePainStore } from '../../store/painStore';
import { colors } from '../../theme/colors';

interface PainLogSheetProps {
  visible: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onSaved?: () => void;
}

export function PainLogSheet({ visible, date, onClose, onSaved }: PainLogSheetProps) {
  const [draft, setDraft] = useState<PainDraft>(() => emptyDraft(date));
  const addEvent = usePainStore((s) => s.addEvent);

  // Reset on open
  useEffect(() => {
    if (visible) setDraft(emptyDraft(date));
  }, [visible, date]);

  const handleSave = useCallback(() => {
    const input = draftToEvent(draft);
    if (!input) return;
    if (addEvent(input)) {
      onSaved?.();
      onClose();
    }
  }, [draft, addEvent, onSaved, onClose]);

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

  const medicationNamed = draft.medicationName.trim().length > 0;

  const handleNameChange = (text: string) => {
    setDraft((prev) => ({
      ...prev,
      medicationName: text,
      medicationEffectiveness: text.trim().length > 0 ? prev.medicationEffectiveness : null,
    }));
  };

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
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Log pain</Text>
          <Text style={styles.subtitle}>{formattedDate}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* WHERE */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>WHERE</Text>
            <Text style={styles.hint}>Select every area that hurts.</Text>
            <View style={styles.regionGrid}>
              {BODY_REGIONS.map((region) => {
                const selected = draft.locations.includes(region);
                return (
                  <TouchableOpacity
                    key={region}
                    style={[styles.regionChip, selected && styles.regionChipActive]}
                    onPress={() =>
                      setDraft((prev) => ({
                        ...prev,
                        locations: toggleRegion(prev.locations, region),
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={REGION_LABEL[region]}
                  >
                    <Text style={[styles.regionLabel, selected && styles.regionLabelActive]}>
                      {REGION_LABEL[region]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* INTENSITY */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>INTENSITY</Text>
            <Text style={styles.hint}>0 = none · 10 = worst imaginable</Text>
            <View style={styles.numberRow}>
              {INTENSITY_STEPS.map((n) => {
                const selected = draft.intensity === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.numberBtn, selected && styles.numberBtnActive]}
                    onPress={() => setDraft((prev) => ({ ...prev, intensity: n }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${n} out of 10`}
                  >
                    <Text style={[styles.numberText, selected && styles.numberTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DURATION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>DURATION</Text>
            <View style={styles.regionGrid}>
              {DURATION_OPTIONS.map((opt) => {
                const selected = draft.durationMin === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setDraft((prev) => ({ ...prev, durationMin: opt.value }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* MEDICATION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>MEDICATION (OPTIONAL)</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={draft.medicationName}
                onChangeText={handleNameChange}
                placeholder="Name, e.g. ibuprofen"
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel="Medication name"
              />
            </View>
            {medicationNamed && (
              <View style={styles.medEffect}>
                <Text style={styles.hint}>How well did it work?</Text>
                <Text style={styles.hint}>1 = not at all · 5 = completely</Text>
                <View style={styles.numberRow}>
                  {EFFECTIVENESS_STEPS.map((n) => {
                    const selected = draft.medicationEffectiveness === n;
                    return (
                      <TouchableOpacity
                        key={n}
                        style={[styles.numberBtn, selected && styles.numberBtnActive]}
                        onPress={() =>
                          setDraft((prev) => ({ ...prev, medicationEffectiveness: n }))
                        }
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${n} out of 5`}
                      >
                        <Text style={[styles.numberText, selected && styles.numberTextActive]}>
                          {n}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          <View style={styles.scrollPad} />
        </ScrollView>

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
            style={[styles.footerBtn, styles.saveBtn, !canSaveDraft(draft) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSaveDraft(draft)}
            accessibilityRole="button"
            accessibilityLabel="Save pain episode"
          >
            <Text style={styles.saveBtnText}>Save</Text>
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
    shadowColor: colors.text,
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
    paddingBottom: 14,
    marginBottom: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  // Region chips (mirrors DailyFlow symptomChip)
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionChip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionChipActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  regionLabel: { fontSize: 14, color: colors.text },
  regionLabelActive: { color: colors.textLight, fontWeight: '600' },
  // Number buttons (intensity / effectiveness)
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBtnActive: { backgroundColor: colors.periodConfirmed, borderColor: colors.periodConfirmed },
  numberText: { fontSize: 13, fontWeight: '600', color: colors.text },
  numberTextActive: { color: colors.textLight },
  // Duration chips (mirrors CategoryRow chip)
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.periodConfirmed + '18',
    borderColor: colors.periodConfirmed,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.periodConfirmed,
  },
  // Medication input (mirrors DailyLogSheet searchWrap/searchInput)
  inputWrap: {
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  medEffect: {
    gap: 8,
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
