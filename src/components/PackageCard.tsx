import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PackageTemplate } from '@/api/types';
import { formatMoney } from '@/lib/money';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { PackageGlyph } from './PackageGlyph';
import { Text } from './Text';

export interface PackageCardProps {
  template: PackageTemplate;
  /** Sender-currency price in minor units (pre-computed with FX). */
  priceSender: number;
  senderCurrency: string;
  localCurrency: string;
  selected?: boolean;
  onPress?: () => void;
}

/** The signature component (spec §8.4): glyph, title, description, dual price, badge, selected ring. */
export function PackageCard({
  template,
  priceSender,
  senderCurrency,
  localCurrency,
  selected = false,
  onPress,
}: PackageCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${template.name}. ${template.description}. ${formatMoney(priceSender, senderCurrency)}`}
      style={{
        borderWidth: 2,
        borderColor: selected ? colors.primary : 'transparent',
        borderRadius: radius.lg,
      }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <PackageGlyph glyph={template.glyph} />
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Text variant="title">{template.name}</Text>
            {template.popular && (
              <View
                style={{
                  backgroundColor: colors.accentTint,
                  borderRadius: radius.pill,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                }}
              >
                <Text variant="caption" color="accent">
                  {t('sender.mostSent')}
                </Text>
              </View>
            )}
          </View>
          <Text variant="body" color="secondary">
            {template.description}
          </Text>
          <View style={{ marginTop: spacing.xxs }}>
            <Text variant="bodyStrong">{formatMoney(priceSender, senderCurrency)}</Text>
            {localCurrency !== senderCurrency && (
              <Text variant="caption" color="muted">
                ≈ {formatMoney(template.basePriceLocal, localCurrency)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}
