import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** Pulsing placeholder block. Compose to match the final layout (spec §7). */
export function Skeleton({ width, height = 16, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[
        { width: width ?? '100%', height, borderRadius: radius.sm, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

/** Ready-made skeleton matching a list of cards. */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.md,
            gap: spacing.xs,
          }}
        >
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Skeleton width={56} height={56} style={{ borderRadius: radius.md }} />
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Skeleton width="70%" height={18} />
              <Skeleton width="90%" height={13} />
              <Skeleton width="40%" height={13} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
