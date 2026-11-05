import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MAX_TAG_NAME_LENGTH } from '../../lib/customTags';
import {
  DEFAULT_TAG_COLOR,
  DEFAULT_TAG_ICON,
  SCALE_OPTIONS,
  TAG_COLOR_IDS,
  TAG_ICONS,
  resolveTagColor,
  type TagColorId,
} from '../../lib/tagsManager';
import { colors } from '../../theme/colors';
import type { CustomTagScale } from '../../types/customTags';

export interface TagFormValues {
  name: string;
  scaleType: CustomTagScale;
  icon: string;
  /** Palette id (TAG_COLOR_IDS), stored on the tag; resolved to a hex only for display. */
  color: string;
}

interface TagFormProps {
  mode: 'create' | 'rename';
  initialName?: string;
  submitLabel: string;
  error: string | null;
  onSubmit: (values: TagFormValues) => void;
  onCancel: () => void;
}

/** Name + (create only) logging style, icon and colour for a custom tag. */
export function TagForm({ mode, initialName = '', submitLabel, error, onSubmit, onCancel }: TagFormProps) {
  const [name, setName] = useState(initialName);
  const [scaleType, setScaleType] = useState<CustomTagScale>('binary');
  const [icon, setIcon] = useState<string>(DEFAULT_TAG_ICON);
  const [color, setColor] = useState<TagColorId>(DEFAULT_TAG_COLOR);
  const scaleHint = SCALE_OPTIONS.find((o) => o.id === scaleType)?.hint;

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        maxLength={MAX_TAG_NAME_LENGTH}
        placeholder="e.g. Brain fog"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Tag name"
        autoFocus
      />

      {mode === 'create' && (
        <>
          <Text style={styles.label}>How do you log it?</Text>
          <View style={styles.chipRow}>
            {SCALE_OPTIONS.map((o) => (
              <Chip
                key={o.id}
                label={o.label}
                selected={scaleType === o.id}
                onPress={() => setScaleType(o.id)}
              />
            ))}
          </View>
          {scaleHint && <Text style={styles.hint}>{scaleHint}</Text>}

          <Text style={styles.label}>Icon</Text>
          <View style={styles.chipRow}>
            {TAG_ICONS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconChip, icon === i && styles.chipSelected]}
                onPress={() => setIcon(i)}
                accessibilityRole="button"
                accessibilityLabel={`Icon ${i}`}
                accessibilityState={{ selected: icon === i }}
              >
                <Text style={styles.iconText}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.chipRow}>
            {TAG_COLOR_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.dot, color === id && styles.chipSelected]}
                onPress={() => setColor(id)}
                accessibilityRole="button"
                accessibilityLabel={id}
                accessibilityState={{ selected: color === id }}
              >
                <View style={[styles.dotInner, { backgroundColor: resolveTagColor(id) }]} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => onSubmit({ name, scaleType, icon, color })}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
        >
          <Text style={styles.primaryText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: { fontSize: 13, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: { borderColor: colors.periodConfirmed },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextSelected: { color: colors.periodConfirmed },
  iconChip: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconText: { fontSize: 20 },
  dot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotInner: { width: 26, height: 26, borderRadius: 13 },
  error: { fontSize: 14, color: colors.periodConfirmed, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  secondaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  primaryBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.periodConfirmed,
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: colors.textLight },
});
