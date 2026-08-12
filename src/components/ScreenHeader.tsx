import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, back = false, action }: ScreenHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ gap: spacing.xxs, marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            hitSlop={8}
            style={{
              width: touchTarget,
              height: touchTarget,
              alignItems: 'center',
              justifyContent: 'center',
              marginStart: -spacing.xs,
            }}
          >
            {/* arrow flips automatically under RTL because of I18nManager */}
            <Feather name="arrow-left" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
        <Text variant="h1" style={{ flex: 1 }}>
          {title}
        </Text>
        {action}
      </View>
      {subtitle != null && (
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
