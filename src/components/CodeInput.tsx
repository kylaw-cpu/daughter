import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radius, spacing, typeScale } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface CodeInputProps {
  length: 4 | 6;
  value: string;
  onChange(value: string): void;
  /** Fires once when all boxes are filled (auto-submit, spec §6.1). */
  onComplete?(value: string): void;
  error?: boolean;
  secret?: boolean;
  autoFocus?: boolean;
  accessibilityLabel?: string;
}

/**
 * Shared digit-box input behind `OtpInput` (6) and `PinInput` (4).
 * One hidden TextInput drives all boxes, so paste and SMS autofill work and
 * screen readers treat it as a single field.
 */
export function CodeInput({
  length,
  value,
  onChange,
  onComplete,
  error = false,
  secret = false,
  autoFocus = true,
  accessibilityLabel,
}: CodeInputProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const completedFor = useRef<string | null>(null);

  useEffect(() => {
    if (error && !reducedMotion) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Animated.sequence(
        [10, -10, 6, -6, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 50, useNativeDriver: true })
        )
      ).start();
    }
  }, [error, reducedMotion, shake]);

  useEffect(() => {
    if (value.length === length && completedFor.current !== value) {
      completedFor.current = value;
      onComplete?.(value);
    }
  }, [value, length, onComplete]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={() => inputRef.current?.focus()}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          gap: spacing.xs,
          justifyContent: 'center',
          transform: [{ translateX: shake }],
        }}
      >
        {Array.from({ length }).map((_, i) => {
          const char = value[i];
          const active = focused && value.length === i;
          return (
            <View
              key={i}
              style={{
                width: length === 6 ? 48 : 56,
                height: 60,
                borderRadius: radius.sm,
                borderWidth: 2,
                borderColor: error ? colors.danger : active ? colors.primary : colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.Text
                style={{
                  ...typeScale.h1,
                  color: error ? colors.danger : colors.textPrimary,
                }}
              >
                {char ? (secret ? '•' : char) : ''}
              </Animated.Text>
            </View>
          );
        })}
      </Animated.View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          completedFor.current = null;
          onChange(text.replace(/\D/g, '').slice(0, length));
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={length === 6 ? 'sms-otp' : undefined}
        autoFocus={autoFocus}
        maxLength={length}
        caretHidden
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}

export function OtpInput(props: Omit<CodeInputProps, 'length' | 'secret'>) {
  return <CodeInput length={6} {...props} />;
}

export function PinInput(props: Omit<CodeInputProps, 'length' | 'secret'>) {
  return <CodeInput length={4} secret {...props} />;
}
