import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import type { WipeMode } from '../../types/encryption';

interface WipeConfirmSheetProps {
  visible: boolean;
  onConfirm: (mode: WipeMode) => void;
  onCancel: () => void;
}

export function WipeConfirmSheet({ visible, onConfirm, onCancel }: WipeConfirmSheetProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [selected, setSelected] = useState<WipeMode>('soft');

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onCancel} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <Text style={styles.title}>Delete all data</Text>
        <Text style={styles.body}>
          This will permanently erase all your cycle logs, health data, and settings from this device.
          {'\n\n'}
          Choose how you'd like to proceed:
        </Text>

        {/* Soft delete option */}
        <TouchableOpacity
          style={[styles.option, selected === 'soft' && styles.optionSelected]}
          onPress={() => setSelected('soft')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === 'soft' }}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.radio, selected === 'soft' && styles.radioSelected]} />
            <Text style={styles.optionTitle}>Delete in 7 days</Text>
          </View>
          <Text style={styles.optionDesc}>
            Your data is queued for deletion. You can cancel within 7 days by logging back in.
          </Text>
        </TouchableOpacity>

        {/* Immediate delete option */}
        <TouchableOpacity
          style={[styles.option, selected === 'immediate' && styles.optionSelectedDanger]}
          onPress={() => setSelected('immediate')}
          accessibilityRole="radio"
          accessibilityState={{ selected: selected === 'immediate' }}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.radio, selected === 'immediate' && styles.radioDanger]} />
            <Text style={[styles.optionTitle, selected === 'immediate' && styles.dangerText]}>
              Delete immediately
            </Text>
          </View>
          <Text style={styles.optionDesc}>
            All data is erased right now. This cannot be undone.
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.confirmBtn, selected === 'immediate' && styles.confirmBtnDanger]}
            onPress={() => onConfirm(selected)}
            accessibilityRole="button"
          >
            <Text style={styles.confirmBtnText}>
              {selected === 'immediate' ? 'Delete now — cannot undo' : 'Queue deletion'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.cancelBtnText}>Cancel</Text>
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 44,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  option: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: colors.fertile,
    backgroundColor: colors.fertile + '10',
  },
  optionSelectedDanger: {
    borderColor: '#E57373',
    backgroundColor: '#E5737310',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioSelected: {
    borderColor: colors.fertile,
    backgroundColor: colors.fertile,
  },
  radioDanger: {
    borderColor: '#E57373',
    backgroundColor: '#E57373',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dangerText: {
    color: '#C62828',
  },
  optionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    paddingLeft: 28,
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: colors.fertile,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDanger: {
    backgroundColor: '#C62828',
  },
  confirmBtnText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
