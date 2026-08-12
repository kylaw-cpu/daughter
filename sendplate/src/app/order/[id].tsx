import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  EmptyState,
  ProofPhoto,
  Screen,
  ScreenHeader,
  Skeleton,
  StatusChip,
  Text,
} from '@/components';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Delivery detail (spec §6.2 Activity): itemized "what they received",
 * vendor confirmation + note, and where it was redeemed. The map pin is a
 * lightweight static representation (coordinates + address) — an
 * interactive map is lazy-loaded in a later phase to keep the app small.
 */
export default function OrderDetail() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id!),
    enabled: !!id,
  });
  const order = orderQuery.data;

  return (
    <Screen>
      <ScreenHeader title={t('activity.orderDetail')} />
      {orderQuery.isLoading ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Skeleton height={160} radius={theme.radius.lg} />
          <Skeleton height={22} width="60%" />
          <Skeleton height={16} width="40%" />
        </View>
      ) : !order ? (
        <EmptyState
          title={t('common.errorGeneric')}
          actionLabel={t('common.retry')}
          onAction={() => orderQuery.refetch()}
          icon="alert-circle"
        />
      ) : (
        <View style={{ gap: theme.spacing.md }}>
          {order.proof ? <ProofPhoto photoUrl={order.proof.photoUrl} height={200} /> : null}

          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="h2">{order.templateName}</Text>
              <Text variant="body" color="secondary">
                {t('send.reviewFor', { name: order.recipientName })}
              </Text>
            </View>
            <StatusChip status={order.status} label={t(`activity.status.${order.status}`)} />
          </View>

          {order.proof ? (
            <Card>
              <View style={{ gap: 6 }}>
                <Text variant="title">{t('activity.collectedBy', { vendor: order.proof.vendorName })}</Text>
                <Text variant="caption" color="muted">
                  {formatDateTime(order.proof.collectedAt)}
                </Text>
                {order.proof.note ? (
                  <Text variant="body" color="secondary">
                    “{order.proof.note}”
                  </Text>
                ) : null}
                {order.proof.location ? (
                  <View style={styles.mapRow}>
                    <Feather name="map-pin" size={16} color={theme.colors.accent} />
                    <Text variant="caption" color="secondary">
                      {t('activity.redeemedAt')} {order.proof.location.lat.toFixed(4)},{' '}
                      {order.proof.location.lng.toFixed(4)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          ) : null}

          <Card>
            <View style={{ gap: 8 }}>
              <Text variant="title">{t('activity.whatTheyReceived')}</Text>
              {(order.proof?.itemsDelivered ?? order.items).map((item) => (
                <View key={item.key} style={styles.itemRow}>
                  <Feather name="check" size={16} color={theme.colors.success} />
                  <Text variant="body" style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                  <Text variant="body" color="muted">
                    ×{item.quantity}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <View style={{ gap: 6 }}>
              <View style={styles.itemRow}>
                <Text variant="body" color="secondary" style={{ flex: 1 }}>
                  {t('send.youPay')}
                </Text>
                <Text variant="bodyStrong">
                  {formatMoney(order.amountSenderCurrency, order.senderCurrency)}
                </Text>
              </View>
              <Text variant="caption" color="muted">
                {t('send.theyReceive', {
                  name: order.recipientName,
                  amount: formatMoney(order.amountLocalCurrency, order.localCurrency),
                })}
              </Text>
            </View>
          </Card>

          {order.message?.type === 'text' && order.message.content ? (
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

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
