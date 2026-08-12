import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { OrderStatus } from '@/api/types';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

/**
 * Status is never conveyed by color alone (spec §8.1): every chip pairs a
 * semantic color with an icon and a label.
 */
export function StatusChip({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const map: Record<OrderStatus, { color: string; icon: keyof typeof Feather.glyphMap; label: string }> = {
    created: { color: colors.textMuted, icon: 'clock', label: t('sender.statusSent') },
    paid: { color: colors.info, icon: 'send', label: t('sender.statusSent') },
    ready: { color: colors.warning, icon: 'shopping-bag', label: t('sender.statusReady') },
    collected: { color: colors.success, icon: 'check-circle', label: t('sender.statusCollected') },
    expired: { color: colors.textMuted, icon: 'slash', label: t('sender.statusExpired') },
    refunded: { color: colors.info, icon: 'rotate-ccw', label: t('sender.statusRefunded') },
  };
  const { color, icon, label } = map[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xxs,
        backgroundColor: `${color}22`,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.xs + 2,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Feather name={icon} size={13} color={color} />
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
