import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { typeScale, TypeVariant } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'accent' | 'danger';
  align?: TextStyle['textAlign'];
  children?: React.ReactNode;
}

/**
 * The only way text is rendered in SendPlate — raw font sizes are banned
 * (spec §8.2). Supports OS font scaling; large display/button text scales a
 * little less so layouts survive 130%+.
 */
export function Text({ variant = 'body', color = 'primary', align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const colorValue = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    inverse: colors.onPrimary,
    brand: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
  }[color];
  const big = variant === 'display' || variant === 'h1' || variant === 'button';
  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={big ? 1.3 : 1.5}
      style={[typeScale[variant], { color: colorValue, textAlign: align }, style]}
      {...rest}
    />
  );
}
