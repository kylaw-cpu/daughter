import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?(): void;
}

/** Friendly illustration + one sentence + one clear action; never a dead end (spec §7). */
export function EmptyState({ icon = 'heart', title, body, ctaLabel, onCta }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.giant, paddingHorizontal: spacing.xl }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: colors.primaryTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={40} color={colors.primaryDark} />
      </View>
      <Text variant="h2" align="center">
        {title}
      </Text>
      {body != null && (
        <Text variant="body" color="secondary" align="center">
          {body}
        </Text>
      )}
      {ctaLabel != null && onCta != null && (
        <Button label={ctaLabel} onPress={onCta} fullWidth={false} style={{ marginTop: spacing.xs }} />
      )}
    </View>
  );
}
