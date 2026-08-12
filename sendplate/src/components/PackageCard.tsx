import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatMoney, localToSender } from '@/lib/money';
import { PackageTemplate } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';
import { Card } from './Card';
import { PackageGlyph } from './PackageGlyph';
import { Text } from './Text';

export interface PackageCardProps {
  template: PackageTemplate;
  senderCurrency: string;
  localCurrency: string;
  fxRate: number;
  selected?: boolean;
  onPress?: () => void;
}

/**
 * The signature component (spec §8.4): glyph, human name, plain-language
 * description, dual-currency price, "Most sent" badge, selected ring.
 * Concrete and dignified, not clinical.
 */
export function PackageCard({
  template,
  senderCurrency,
  localCurrency,
  fxRate,
  selected = false,
  onPress,
}: PackageCardProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const senderPrice = formatMoney(localToSender(template.basePriceLocal, fxRate), senderCurrency);
  const localPrice = formatMoney(template.basePriceLocal, localCurrency);

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${template.name}. ${template.description} ${senderPrice}`}
      accessibilityHint={onPress ? t('send.choosePackageTitle') : undefined}
      style={StyleSheet.flatten([
        selected && {
          borderWidth: 2,
          borderColor: theme.colors.primary,
        },
      ])}
    >
      <View style={styles.row}>
        <View style={[styles.glyphWrap, { backgroundColor: theme.colors.bg, borderRadius: theme.radius.md }]}>
          <PackageGlyph glyph={template.glyph} size={52} />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text variant="title" style={styles.titleText} numberOfLines={2}>
              {template.name}
            </Text>
            {template.popular ? (
              <View style={[styles.badge, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radius.pill }]}>
                <Text variant="caption" style={{ color: theme.colors.accent, fontFamily: 'Inter_500Medium' }}>
                  {t('send.mostSent')}
                </Text>
              </View>
            ) : null}
          </View>
          <Text variant="body" color="secondary">
            {template.description}
          </Text>
          <Text variant="caption" color="accent" style={styles.coverage}>
            {template.coverage}
          </Text>
          <View style={styles.priceRow}>
            <Text variant="h2" color="brand">
              {senderPrice}
            </Text>
            <Text variant="caption" color="muted">
              ≈ {localPrice}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  glyphWrap: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  titleText: { flexShrink: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2 },
  coverage: { fontFamily: 'Inter_500Medium' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
});
