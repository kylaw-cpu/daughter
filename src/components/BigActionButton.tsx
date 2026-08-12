import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/**
 * Oversized primary action for recipient-facing screens (spec §8.4) — usable
 * one-handed, at arm's length, in sunlight, by someone who doesn't read well.
 */
export function BigActionButton({
  label,
  icon = 'maximize',
  onPress,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.primaryDark : colors.primary,
        borderRadius: radius.lg,
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        padding: spacing.xl,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Feather name={icon} size={32} color={colors.onPrimary} />
        <Text variant="h1" style={{ color: colors.onPrimary }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
