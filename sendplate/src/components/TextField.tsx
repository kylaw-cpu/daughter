import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  /** Show a clear (×) affordance when there is text. */
  clearable?: boolean;
}

/** Labeled big input with helper/error text and a clear affordance (spec §8.4). */
export function TextField({
  label,
  helperText,
  errorText,
  clearable = true,
  value,
  onChangeText,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const hasError = !!errorText;

  const borderColor = hasError
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="bodyStrong" color="secondary">
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <TextInput
          accessibilityLabel={label ?? rest.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.textPrimary },
            style,
          ]}
          {...rest}
        />
        {clearable && !!value && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear"
            hitSlop={12}
            onPress={() => onChangeText?.('')}
            style={styles.clear}
          >
            <Feather name="x-circle" size={20} color={theme.colors.textMuted} />
          </Pressable>
        )}
      </View>
      {hasError ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {errorText}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color="muted">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, alignSelf: 'stretch' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 14 },
  clear: { padding: 4 },
});
