import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnline } from '@/store/network';
import { Text } from './Text';

/** Slim persistent banner shown whenever the device is offline (spec §7). */
export function OfflineBanner({ message }: { message?: string }) {
  const online = useOnline();
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (online) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        backgroundColor: colors.warning,
        paddingVertical: spacing.xxs + 2,
        paddingHorizontal: spacing.md,
      }}
    >
      <Feather name="wifi-off" size={14} color="#241E1A" />
      <Text variant="caption" style={{ color: '#241E1A' }}>
        {message ?? t('common.offlineBanner')}
      </Text>
    </View>
  );
}
