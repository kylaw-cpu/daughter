import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

/** Plain-language error + retry; never raw error codes (spec §7). */
export function ErrorState({ message, onRetry }: { message?: string; onRetry(): void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.giant, paddingHorizontal: spacing.xl }}>
      <Feather name="cloud-off" size={40} color={colors.textMuted} />
      <Text variant="body" color="secondary" align="center">
        {message ?? t('common.genericError')}
      </Text>
      <Button label={t('common.retry')} onPress={onRetry} fullWidth={false} variant="secondary" />
    </View>
  );
}
