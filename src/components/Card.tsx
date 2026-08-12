import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { radius, shadow, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  padded?: boolean;
  testID?: string;
}

/** Surface with `lg` radius and the one soft elevation token; hairline border in dark mode. */
export function Card({ children, onPress, style, accessibilityLabel, padded = true, testID }: CardProps) {
  const { colors, dark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const surface: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padded ? spacing.md : 0,
    ...(dark ? { borderWidth: 1, borderColor: colors.border } : shadow.soft),
  };

  if (!onPress) {
    return <View style={[surface, style]}>{children}</View>;
  }

  const animate = (to: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        onPress={onPress}
        onPressIn={() => animate(0.98)}
        onPressOut={() => animate(1)}
        style={({ pressed }) => [surface, pressed && { opacity: 0.92 }, style]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
