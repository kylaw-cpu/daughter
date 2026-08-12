import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typeScale } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
}

export function TextField({ label, helper, error, style, ...rest }: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xxs }}>
      {label != null && (
        <Text variant="bodyStrong" color="secondary">
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={label ?? rest.placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            minHeight: 52,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            color: colors.textPrimary,
            fontFamily: typeScale.body.fontFamily,
            fontSize: typeScale.body.fontSize,
            textAlign: undefined, // let RTL flow naturally
          },
          style,
        ]}
        {...rest}
      />
      {error != null ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper != null ? (
        <Text variant="caption" color="muted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
