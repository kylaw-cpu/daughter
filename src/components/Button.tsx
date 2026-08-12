import React, { useRef } from 'react';
import {
  AccessibilityState,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Text } from './Text';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  /** Full-width by default on mobile (spec §8.4). */
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  const blocked = disabled || loading;

  const bg = {
    primary: colors.primary,
    secondary: colors.primaryTint,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.primaryDark,
    ghost: colors.primary,
    danger: colors.onPrimary,
  }[variant];

  const animate = (to: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const a11yState: AccessibilityState = { disabled: blocked, busy: loading };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { alignSelf: 'stretch' }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={a11yState}
        testID={testID}
        disabled={blocked}
        onPressIn={() => animate(0.98)}
        onPressOut={() => animate(1)}
        onPress={() => {
          if (variant === 'primary') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          onPress?.();
        }}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radius.pill,
          backgroundColor: pressed && bg !== 'transparent' ? darken(bg) : bg,
          opacity: blocked && !loading ? 0.45 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.xs,
          paddingHorizontal: spacing.xxl,
          paddingVertical: spacing.sm,
        })}
      >
        {loading ? (
          <ActivityIndicator color={fg} accessibilityLabel={label} />
        ) : (
          <>
            {icon}
            <Text variant="button" style={{ color: fg }}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** Slight darken for the pressed state without extra tokens. */
function darken(hex: string): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const f = (i: number) =>
    Math.max(0, Math.round(parseInt(hex.slice(i, i + 2), 16) * 0.88))
      .toString(16)
      .padStart(2, '0');
  return `#${f(1)}${f(3)}${f(5)}`;
}
