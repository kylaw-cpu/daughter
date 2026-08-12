import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  kind: 'info',
  show: (message, kind = 'info') => set({ message, kind }),
  hide: () => set({ message: null }),
}));

/** Imperative helper: `toast('Saved', 'success')` from anywhere. */
export function toast(message: string, kind: ToastKind = 'info') {
  useToastStore.getState().show(message, kind);
}

/** Host rendered once in the root layout. Plain language only (spec §7). */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message, kind, hide } = useToastStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() =>
        hide()
      );
    }, 3200);
    return () => clearTimeout(timer);
  }, [message, opacity, hide]);

  if (!message) return null;

  const iconByKind: Record<ToastKind, keyof typeof Feather.glyphMap> = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info',
  };
  const colorByKind: Record<ToastKind, string> = {
    success: theme.colors.success,
    error: theme.colors.danger,
    info: theme.colors.info,
  };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.toast,
        theme.shadow,
        {
          opacity,
          top: insets.top + 8,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: theme.isDark ? StyleSheet.hairlineWidth : 0,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Feather name={iconByKind[kind]} size={18} color={colorByKind[kind]} />
      <Text variant="bodyStrong" style={styles.message}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    zIndex: 100,
  },
  message: { flex: 1 },
});
