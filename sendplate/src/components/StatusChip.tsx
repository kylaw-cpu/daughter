import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { OrderStatus } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface StatusChipProps {
  status: OrderStatus;
  label: string;
}

/**
 * Status chip: icon + label + semantic color — never color alone
 * (accessibility, spec §8.1). Sent = info, Ready = warning, Collected =
 * success.
 */
export function StatusChip({ status, label }: StatusChipProps) {
  const theme = useTheme();
  const c = theme.colors;

  const config: Record<OrderStatus, { bg: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
    created: { bg: c.infoTint, fg: c.info, icon: 'clock' },
    paid: { bg: c.infoTint, fg: c.info, icon: 'send' },
    ready: { bg: c.warningTint, fg: theme.isDark ? c.warning : '#8A6404', icon: 'gift' },
    collected: { bg: c.successTint, fg: c.success, icon: 'check-circle' },
    expired: { bg: c.dangerTint, fg: c.danger, icon: 'x-circle' },
    refunded: { bg: c.dangerTint, fg: c.danger, icon: 'rotate-ccw' },
  };
  const { bg, fg, icon } = config[status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[styles.chip, { backgroundColor: bg, borderRadius: theme.radius.pill }]}
    >
      <Feather name={icon} size={13} color={fg} />
      <Text variant="caption" style={{ color: fg, fontFamily: 'Inter_500Medium' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
});
