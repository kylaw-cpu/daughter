import { Feather } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  PackageGlyph,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components';
import { formatMoney, localToSender } from '@/lib/money';
import { useAuthStore } from '@/store/authStore';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

const FX_RATE = 129.35;

/**
 * Send step 3 (spec §6.2): quantity + add-ons with live price updates and a
 * plain-language nutrition summary; optional personal message.
 */
export default function Customize() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    template,
    quantity,
    setQuantity,
    selectedAddOnKeys,
    toggleAddOn,
    messageText,
    setMessageText,
    totalLocalMinor,
  } = useSendFlow();

  if (!template) return <Redirect href="/send/choose-package" />;

  const totalLocal = totalLocalMinor();
  const totalSender = localToSender(totalLocal, FX_RATE);

  return (
    <Screen
      footer={
        <View style={{ gap: 6 }}>
          <Text variant="body" color="secondary" align="center">
            {formatMoney(totalSender, user?.currency ?? 'USD')} ·{' '}
            {formatMoney(totalLocal, 'KES')}
          </Text>
          <Button label={t('common.continue')} onPress={() => router.push('/send/review')} />
        </View>
      }
    >
      <ScreenHeader title={t('send.customizeTitle')} />
      <View style={{ gap: theme.spacing.md }}>
        <View style={styles.headerRow}>
          <PackageGlyph glyph={template.glyph} size={48} />
          <View style={{ flex: 1 }}>
            <Text variant="title">{template.name}</Text>
            <Text variant="caption" color="accent">
              {t('send.coverageNow', { coverage: template.coverage })}
            </Text>
          </View>
        </View>

        <Card>
          <View style={styles.qtyRow}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {t('send.quantity')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="−"
              onPress={() => setQuantity(quantity - 1)}
              style={[styles.qtyBtn, { backgroundColor: theme.colors.bg, borderRadius: theme.radius.pill }]}
            >
              <Feather name="minus" size={20} color={theme.colors.textPrimary} />
            </Pressable>
            <Text variant="h2" style={styles.qtyValue} accessibilityLiveRegion="polite">
              {quantity}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="+"
              onPress={() => setQuantity(quantity + 1)}
              style={[styles.qtyBtn, { backgroundColor: theme.colors.primaryTint, borderRadius: theme.radius.pill }]}
            >
              <Feather name="plus" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>
        </Card>

        {template.addOns.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="title">{t('send.addOnsTitle')}</Text>
            {template.addOns.map((addOn) => {
              const active = selectedAddOnKeys.includes(addOn.key);
              return (
                <Card
                  key={addOn.key}
                  onPress={() => toggleAddOn(addOn.key)}
                  accessibilityLabel={addOn.label}
                  style={StyleSheet.flatten([
                    active && { borderWidth: 2, borderColor: theme.colors.accent },
                  ])}
                >
                  <View style={styles.addOnRow}>
                    <Feather
                      name={active ? 'check-circle' : 'circle'}
                      size={22}
                      color={active ? theme.colors.accent : theme.colors.textMuted}
                    />
                    <Text variant="body" style={{ flex: 1 }}>
                      {addOn.label}
                    </Text>
                    <Text variant="bodyStrong" color="secondary">
                      {formatMoney(localToSender(addOn.unitPriceLocal, FX_RATE), user?.currency ?? 'USD')}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="title">{t('send.messageTitle')}</Text>
          <TextField
            placeholder={t('send.messagePlaceholder')}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { minWidth: 32, textAlign: 'center' },
  addOnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
