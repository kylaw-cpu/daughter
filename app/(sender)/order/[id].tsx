import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardListSkeleton,
  ErrorState,
  Screen,
  ScreenHeader,
  StatusChip,
  Text,
} from '@/components';
import { MOCK_VENDORS, buildPackageTemplates } from '@/api/mockData';
import { useOrder, useRecipients } from '@/hooks/queries';
import { track } from '@/analytics/analytics';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Proof-of-delivery detail: photo, itemized list, vendor + map pin (spec §6.2). */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const order = useOrder(typeof id === 'string' ? id : undefined);
  const recipients = useRecipients();

  useEffect(() => {
    if (order.data?.proof) track('proof_viewed', { orderId: order.data.id });
  }, [order.data?.id, order.data?.proof]);

  if (order.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t('sender.proofTitle')} back />
        <CardListSkeleton count={2} />
      </Screen>
    );
  }
  if (order.isError || !order.data) {
    return (
      <Screen>
        <ScreenHeader title={t('sender.proofTitle')} back />
        <ErrorState onRetry={() => order.refetch()} />
      </Screen>
    );
  }

  const o = order.data;
  const recipient = recipients.data?.find((r) => r.id === o.recipientId);
  const template = buildPackageTemplates().find((tp) => tp.id === o.templateId);
  const vendor = o.proof ? MOCK_VENDORS.find((v) => v.id === o.proof!.vendorId) : undefined;

  return (
    <Screen>
      <ScreenHeader title={t('sender.proofTitle')} subtitle={template?.name} back />
      <View style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="h2" style={{ flex: 1 }}>
            {recipient?.name ?? ''}
          </Text>
          <StatusChip status={o.status} />
        </View>

        {o.proof && (
          <>
            <Image
              source={{ uri: o.proof.photoUrl }}
              accessibilityLabel={t('sender.proofTitle')}
              style={{
                width: '100%',
                aspectRatio: 4 / 3,
                borderRadius: radius.lg,
                backgroundColor: colors.border,
              }}
            />
            {vendor != null && (
              <Card>
                <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
                  <Feather name="map-pin" size={20} color={colors.info} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{t('sender.collectedAt', { vendor: vendor.name })}</Text>
                    <Text variant="body" color="secondary">
                      {vendor.address}
                    </Text>
                    {o.proof.location != null && (
                      <Text variant="caption" color="muted">
                        {o.proof.location.lat.toFixed(4)}, {o.proof.location.lng.toFixed(4)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            )}
            {o.proof.note != null && o.proof.note !== '' && (
              <Card>
                <Text variant="bodyStrong" style={{ marginBottom: spacing.xxs }}>
                  {t('sender.vendorNote')}
                </Text>
                <Text variant="body" color="secondary" style={{ fontStyle: 'italic' }}>
                  “{o.proof.note}”
                </Text>
              </Card>
            )}
          </>
        )}

        <Card>
          <Text variant="title" style={{ marginBottom: spacing.xs }}>
            {t('sender.whatTheyReceived')}
          </Text>
          <View style={{ gap: spacing.xs }}>
            {(o.proof?.itemsDelivered ?? o.items).map((item) => (
              <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Feather name="check-circle" size={16} color={colors.success} />
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
      </View>
    </Screen>
  );
}
