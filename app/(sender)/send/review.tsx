import React from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, ScreenHeader, Text, useToast } from '@/components';
import { FX_RATE, LOCAL_CURRENCY, eligibleVendorsFor } from '@/api/mockData';
import { useCreateOrder } from '@/hooks/queries';
import { formatMoney } from '@/lib/money';
import { priceItems, toSenderAmount } from '@/lib/pricing';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { useSendFlow } from '@/store/sendFlow';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Send flow step 4. Transparency is a feature: the fee is never hidden (spec §6.2). */
export default function ReviewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const { recipient, template, message, selectedItems, draftOrder, setDraftOrder } = useSendFlow();
  const createOrder = useCreateOrder();

  if (!recipient || !template) return <Redirect href="/(sender)/send/choose-recipient" />;

  const items = selectedItems();
  const localAmount = priceItems(items, template);
  const { amountSender, serviceFee, total } = toSenderAmount(localAmount, FX_RATE);
  const currency = user?.currency ?? 'USD';
  const vendors = eligibleVendorsFor(template.category);

  const continueToPay = async () => {
    try {
      // Reuse an existing draft (payment retry) instead of double-creating.
      if (!draftOrder) {
        const order = await createOrder.mutateAsync({
          recipientId: recipient.id,
          templateId: template.id,
          items,
          message: message.trim() ? { type: 'text', content: message.trim() } : undefined,
        });
        setDraftOrder(order);
      }
      track('order_reviewed', { template: template.key });
      router.push('/(sender)/send/pay');
    } catch {
      toast.show(t('common.genericError'), 'error');
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={t('sender.payCta', { amount: formatMoney(total, currency) })}
          onPress={continueToPay}
          loading={createOrder.isPending}
        />
      }
    >
      <ScreenHeader title={t('sender.reviewTitle')} back />
      <View style={{ gap: spacing.md }}>
        <Card>
          <Text variant="title">
            {t('sender.reviewFor', {
              name: recipient.name,
              relationship: t(`auth.relationships.${recipient.relationship}`, {
                defaultValue: recipient.relationship,
              }),
            })}
          </Text>
        </Card>

        <Card>
          <Text variant="title" style={{ marginBottom: spacing.xs }}>
            {t('sender.whatsInside')}
          </Text>
          <View style={{ gap: spacing.xs }}>
            {items.map((item) => (
              <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Feather name="check" size={16} color={colors.accent} />
                <Text variant="body" style={{ flex: 1 }}>
                  {item.label}
                </Text>
                {item.quantity > 1 && (
                  <Text variant="bodyStrong" color="secondary">
                    ×{item.quantity}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text variant="title" style={{ marginBottom: spacing.xs }}>
            {t('sender.priceBreakdown')}
          </Text>
          <View style={{ gap: spacing.xs }}>
            <PriceRow label={t('sender.itemCost')} value={formatMoney(amountSender, currency)} />
            <PriceRow label={t('sender.serviceFee')} value={formatMoney(serviceFee, currency)} />
            <PriceRow
              label={t('sender.fxRate')}
              value={`1 ${currency} ≈ ${FX_RATE.toFixed(0)} ${LOCAL_CURRENCY}`}
            />
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xxs }} />
            <PriceRow label={t('sender.total')} value={formatMoney(total, currency)} strong />
          </View>
          <Text variant="caption" color="accent" style={{ marginTop: spacing.sm }}>
            {t('sender.youPayTheyGet', {
              pay: formatMoney(total, currency),
              get: formatMoney(localAmount, LOCAL_CURRENCY),
            })}
          </Text>
        </Card>

        <Card>
          <Text variant="title" style={{ marginBottom: spacing.xs }}>
            {t('sender.redeemableAt')}
          </Text>
          <View style={{ gap: spacing.xs }}>
            {vendors.map((v) => (
              <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Feather name="map-pin" size={15} color={colors.info} />
                <Text variant="body" color="secondary" style={{ flex: 1 }}>
                  {v.name}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {message.trim().length > 0 && (
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <Feather name="message-circle" size={18} color={colors.primary} />
              <Text variant="body" style={{ flex: 1, fontStyle: 'italic' }}>
                “{message.trim()}”
              </Text>
            </View>
          </Card>
        )}
      </View>
    </Screen>
  );
}

function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
      <Text variant={strong ? 'bodyStrong' : 'body'} color={strong ? 'primary' : 'secondary'}>
        {label}
      </Text>
      <Text variant={strong ? 'bodyStrong' : 'body'}>{value}</Text>
    </View>
  );
}
