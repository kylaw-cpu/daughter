import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Surface card: `lg` radius, one soft warm elevation (hairline border in
 * dark mode instead of shadow), optional pressable variant with a gentle
 * scale press state (spec §8.3/8.4).
 */
export function Card({
  onPress,
  padded = true,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: CardProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const surfaceStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    ...(theme.isDark
      ? { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border }
      : theme.shadow),
  };
  const padding = padded ? { padding: theme.spacing.md } : null;

  if (!onPress) {
    return (
      <View {...rest} style={[surfaceStyle, padding, style]}>
        {children}
      </View>
    );
  }

  const animateTo = (value: number) =>
    Animated.timing(scale, { toValue: value, duration: 100, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        {...rest}
        style={[surfaceStyle, padding, style]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
