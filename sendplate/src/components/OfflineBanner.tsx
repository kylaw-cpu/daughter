import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useOnline } from '@/hooks/useOnline';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface OfflineBannerProps {
  /** Override message, e.g. "offline — your code still works". */
  message?: string;
}

/** Slim persistent banner shown while offline (spec §7). */
export function OfflineBanner({ message }: OfflineBannerProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const online = useOnline();

  if (online) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={message ?? t('common.offlineBanner')}
      style={[styles.banner, { backgroundColor: theme.colors.warningTint }]}
    >
      <Feather
        name="wifi-off"
        size={14}
        color={theme.isDark ? theme.colors.warning : '#8A6404'}
      />
      <Text
        variant="caption"
        style={{ color: theme.isDark ? theme.colors.warning : '#8A6404' }}
      >
        {message ?? t('common.offlineBanner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
});
