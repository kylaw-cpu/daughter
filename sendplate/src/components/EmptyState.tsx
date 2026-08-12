import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Feather.glyphMap;
}

/**
 * Friendly illustration + one sentence + one clear action — never a dead
 * end (spec §7). The illustration is a warm plate/hands motif drawn inline
 * to keep the app bundle small.
 */
export function EmptyState({ title, body, actionLabel, onAction, icon }: EmptyStateProps) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.iconCircle, { backgroundColor: c.primaryTint }]}>
          <Feather name={icon} size={34} color={c.primary} />
        </View>
      ) : (
        <Svg width={120} height={96} viewBox="0 0 120 96" accessibilityLabel="">
          {/* hands */}
          <Path d="M8 84 q18 -18 44 -14" stroke={c.accent} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M112 84 q-18 -18 -44 -14" stroke={c.accent} strokeWidth={6} strokeLinecap="round" fill="none" />
          {/* plate */}
          <Circle cx="60" cy="46" r="30" fill={c.primaryTint} />
          <Circle cx="60" cy="46" r="18" fill={c.primary} />
          <Circle cx="60" cy="46" r="7" fill={c.primaryTint} />
        </Svg>
      )}
      <Text variant="title" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="secondary" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  action: { marginTop: 8 },
});
