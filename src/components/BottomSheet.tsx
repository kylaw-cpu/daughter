import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

export interface BottomSheetProps {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
}

/** Gentle spring-up sheet for payment and confirmations (spec §8.4/8.5). */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
      if (reducedMotion) translateY.setValue(0);
      else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }).start();
      }
    } else {
      translateY.setValue(height);
    }
  }, [visible, height, reducedMotion, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(20,12,8,0.45)' }}
      />
      <Animated.View
        style={{
          transform: [{ translateY }],
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: spacing.xl,
          paddingBottom: spacing.giant,
          gap: spacing.md,
        }}
      >
        <View
          style={{
            alignSelf: 'center',
            width: 44,
            height: 4,
            borderRadius: radius.pill,
            backgroundColor: colors.border,
          }}
        />
        {children}
      </Animated.View>
    </Modal>
  );
}
