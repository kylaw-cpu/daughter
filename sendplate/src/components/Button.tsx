import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import {
  AccessibilityState,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** Buttons are full-width by default on mobile (spec §8.4). */
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Core button: min height 52, pressed state (scale 0.98 + darken), loading
 * spinner replaces label, haptic tap on primary actions (spec §8.4/8.5).
 */
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
  accessibilityHint,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const backgrounds: Record<ButtonVariant, string> = {
    primary: theme.colors.primary,
    secondary: theme.colors.primaryTint,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };
  const pressedBackgrounds: Record<ButtonVariant, string> = {
    primary: theme.colors.primaryDark,
    secondary: theme.colors.primaryTint,
    ghost: 'transparent',
    danger: '#A03024',
  };
  const labelColors: Record<ButtonVariant, string> = {
    primary: theme.colors.textOnPrimary,
    secondary: theme.isDark ? theme.colors.textPrimary : theme.colors.primaryDark,
    ghost: theme.colors.primary,
    danger: theme.colors.textOnPrimary,
  };

  const animateTo = (value: number) => {
    Animated.timing(scale, {
      toValue: value,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (isDisabled || !onPress) return;
    if (variant === 'primary' || variant === 'danger') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const a11yState: AccessibilityState = { disabled: isDisabled, busy: loading };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
        testID={testID}
        disabled={isDisabled}
        onPress={handlePress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [
          styles.base,
          {
            borderRadius: theme.radius.pill,
            backgroundColor: pressed ? pressedBackgrounds[variant] : backgrounds[variant],
            opacity: isDisabled && !loading ? 0.5 : 1,
          },
          variant === 'ghost' && { borderWidth: 1, borderColor: theme.colors.border },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={labelColors[variant]} />
        ) : (
          <View style={styles.content}>
            {icon}
            <Text variant="button" style={{ color: labelColors[variant] }}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { alignSelf: 'stretch' },
  base: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
