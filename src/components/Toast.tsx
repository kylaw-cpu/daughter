import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

type ToastKind = 'success' | 'error' | 'info';

interface ToastContextValue {
  show(message: string, kind?: ToastKind): void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, kind });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() =>
          setToast(null)
        );
      }, 3000);
    },
    [opacity]
  );

  const kindColor = toast?.kind === 'success' ? colors.success : toast?.kind === 'error' ? colors.danger : colors.info;
  const icon: keyof typeof Feather.glyphMap =
    toast?.kind === 'success' ? 'check-circle' : toast?.kind === 'error' ? 'alert-circle' : 'info';

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast != null && (
        <Animated.View
          accessibilityLiveRegion="polite"
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: spacing.xl,
            right: spacing.xl,
            top: insets.top + spacing.xs,
            opacity,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              backgroundColor: colors.surface,
              borderLeftWidth: 4,
              borderLeftColor: kindColor,
              borderRadius: radius.md,
              padding: spacing.md,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}
          >
            <Feather name={icon} size={18} color={kindColor} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
