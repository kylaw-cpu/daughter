import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { TextVariant } from '@/theme/theme';

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'onPrimary' | 'brand' | 'accent' | 'danger';
  align?: 'auto' | 'left' | 'right' | 'center';
}

/**
 * The only way to render text in the app — enforces the type scale (spec §8.2).
 * Never use raw fontSize in screens. Supports OS font scaling up to 150%.
 */
export function Text({
  variant = 'body',
  color = 'primary',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const colorValue = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    onPrimary: theme.colors.textOnPrimary,
    brand: theme.colors.primary,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
  }[color];

  return (
    <RNText
      maxFontSizeMultiplier={1.5}
      {...rest}
      style={StyleSheet.flatten([
        theme.typography[variant],
        { color: colorValue },
        align ? { textAlign: align } : null,
        style,
      ])}
    />
  );
}
