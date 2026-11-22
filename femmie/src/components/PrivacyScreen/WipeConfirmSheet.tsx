import React, { useEffect, useRef } from 'react';
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

interface WipeConfirmSheetProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WipeConfirmSheet({ visible, onConfirm, onCancel }: WipeConfirmSheetProps) {
  const slideAnim = useRef(new Animated.Value(400)).current;

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

        <Text style={styles.title}>Delete everything?</Text>
        <Text style={styles.body}>
          This permanently deletes your account and erases your cycle history, health data, and
          settings from this device and our servers. There is no undo.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.confirmBtnText}>Delete everything</Text>
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
  actions: {
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
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
