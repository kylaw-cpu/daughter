import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  EmptyState,
  PackageGlyph,
  Screen,
  ScreenHeader,
  Skeleton,
  Text,
} from '@/components';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Send step 4 (spec §6.2): full transparency — item cost, service fee and
 * FX rate are always shown; "You pay X → family receives Y". The unpaid
 * order is created here so the FX rate is locked in (spec §13).
 */
export default function Review() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { recipient, template, buildItems, messageText, draftOrder, setDraftOrder } = useSendFlow();

  const createQuery = useQuery({
    queryKey: ['draftOrder', recipient?.id, template?.id],
    queryFn: async () => {
      if (draftOrder) return draftOrder;
      return api.createOrder({
        recipientId: recipient!.id,
        templateId: template!.id,
        items: buildItems(),
        message: messageText.trim() ? { type: 'text', content: messageText.trim() } : undefined,
      });
    },
    enabled: !!recipient && !!template,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (createQuery.data) setDraftOrder(createQuery.data);
  }, [createQuery.data, setDraftOrder]);

  if (!recipient || !template) return <Redirect href="/send/choose-recipient" />;

  const order = createQuery.data;

  return (
    <Screen
      footer={
        order ? (
          <Button
            label={t('send.payNow', {
              amount: formatMoney(order.amountSenderCurrency, order.senderCurrency),
            })}
            onPress={() => router.push('/send/pay')}
          />
        ) : undefined
      }
    >
      <ScreenHeader title={t('send.reviewTitle')} />
      {createQuery.isLoading ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Skeleton height={90} radius={theme.radius.lg} />
          <Skeleton height={140} radius={theme.radius.lg} />
          <Skeleton height={90} radius={theme.radius.lg} />
        </View>
      ) : createQuery.isError || !order ? (
        <EmptyState
          title={t('common.errorGeneric')}
          actionLabel={t('common.retry')}
          onAction={() => createQuery.refetch()}
          icon="alert-circle"
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          <Card>
            <View style={styles.row}>
              <PackageGlyph glyph={order.glyph} size={48} />
              <View style={{ flex: 1 }}>
                <Text variant="title">{order.templateName}</Text>
                <Text variant="body" color="secondary">
                  {t('send.reviewFor', { name: recipient.name })}
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 8 }}>
              <Text variant="title">{t('send.whatsInside')}</Text>
              {order.items.map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <Text variant="body" style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                  <Text variant="body" color="muted">
                    ×{item.quantity}
                  </Text>
                </View>
              ))}
              <Text variant="caption" color="accent">
                {template.coverage}
              </Text>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 8 }}>
              <Text variant="title">{t('send.priceBreakdown')}</Text>
              <PriceRow
                label={t('send.itemsCost')}
                value={formatMoney(order.amountSenderCurrency - order.serviceFee, order.senderCurrency)}
              />
              <PriceRow label={t('send.serviceFee')} value={formatMoney(order.serviceFee, order.senderCurrency)} />
              <PriceRow
                label={t('send.fxRate')}
                value={`1 ${order.senderCurrency} = ${order.fxRate.toFixed(2)} ${order.localCurrency}`}
              />
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.itemRow}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {t('send.youPay')}
                </Text>
                <Text variant="h2" color="brand">
                  {formatMoney(order.amountSenderCurrency, order.senderCurrency)}
                </Text>
              </View>
              <Text variant="caption" color="secondary">
                {t('send.theyReceive', {
                  name: recipient.name,
                  amount: formatMoney(order.amountLocalCurrency, order.localCurrency),
                })}
              </Text>
            </View>
          </Card>

          <Card>
            <View style={{ gap: 4 }}>
              <Text variant="title">{t('send.collectableAt')}</Text>
              <Text variant="body" color="secondary">
                {t('send.vendorsNear', {
                  count: order.eligibleVendorIds.length,
                  town: recipient.town,
                })}
              </Text>
            </View>
          </Card>

          {order.message?.content ? (
            <Card>
              <Text variant="body" color="secondary">
                “{order.message.content}”
              </Text>
            </Card>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.itemRow}>
      <Text variant="body" color="secondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
});
