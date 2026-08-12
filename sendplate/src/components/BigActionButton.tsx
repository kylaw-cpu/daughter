import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface BigActionButtonProps {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityHint?: string;
}

/**
 * The oversized recipient action ("Show my code") — designed for low
 * literacy and shared phones: huge target, icon + words, high contrast
 * (spec §8.4, §6.3).
 */
export function BigActionButton({ label, icon = 'maximize', onPress, accessibilityHint }: BigActionButtonProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) =>
    Animated.timing(scale, { toValue: value, duration: 100, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], alignSelf: 'stretch' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onPress();
        }}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? theme.colors.primaryDark : theme.colors.primary,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Feather name={icon} size={40} color={theme.colors.textOnPrimary} />
        <Text variant="h2" color="onPrimary" align="center">
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
});
