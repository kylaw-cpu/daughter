import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface CodeInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  /** Called once when all boxes are filled (auto-submit, spec §6.1). */
  onComplete?: (value: string) => void;
  error?: boolean;
  secure?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}

/**
 * Shared digit-box input behind `PinInput` (4) and `OtpInput` (6).
 * One hidden TextInput drives N boxes — auto-advance for free, works with
 * SMS OTP auto-fill, and shakes + turns red on error.
 */
export function CodeInput({
  length,
  value,
  onChange,
  onComplete,
  error = false,
  secure = false,
  autoFocus = true,
  accessibilityLabel,
}: CodeInputProps) {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const completedFor = useRef<string | null>(null);

  useEffect(() => {
    if (error) {
      Animated.sequence(
        [10, -10, 8, -8, 4, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 45, useNativeDriver: true })
        )
      ).start();
    }
  }, [error, shake]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length && completedFor.current !== digits) {
      completedFor.current = digits;
      onComplete?.(digits);
    }
    if (digits.length < length) completedFor.current = null;
  };

  const boxes = Array.from({ length }, (_, i) => {
    const char = value[i];
    const active = i === value.length;
    return (
      <View
        key={i}
        style={[
          styles.box,
          {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surface,
            borderColor: error
              ? theme.colors.danger
              : active
                ? theme.colors.primary
                : theme.colors.border,
          },
        ]}
      >
        <Text variant="h2" color={error ? 'danger' : 'primary'}>
          {char ? (secure ? '•' : char) : ''}
        </Text>
      </View>
    );
  });

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => inputRef.current?.focus()}
      style={styles.wrap}
    >
      <Animated.View style={[styles.row, { transform: [{ translateX: shake }] }]}>
        {boxes}
      </Animated.View>
      <TextInput
        ref={inputRef}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        maxLength={length}
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

export function PinInput(props: Omit<CodeInputProps, 'length' | 'secure'>) {
  return <CodeInput {...props} length={4} secure />;
}

export function OtpInput(props: Omit<CodeInputProps, 'length'>) {
  return <CodeInput {...props} length={6} />;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  box: {
    width: 48,
    height: 58,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
