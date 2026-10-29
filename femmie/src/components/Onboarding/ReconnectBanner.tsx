import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';

interface Props {
  visible: boolean;
}

export function ReconnectBanner({ visible }: Props) {
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -60,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  }, [visible, slideAnim]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.text}>📡 You're offline — your data is safe on this device</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF3CD',
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  text: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
    textAlign: 'center',
  },
});
