import React, { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  StatusChip,
  Text,
} from '@/components';
import { useOrders, useRecipients } from '@/hooks/queries';
import { buildPackageTemplates } from '@/api/mockData';
import { friendlyWhen } from '@/lib/dates';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Order } from '@/api/types';

/** The trust payoff (spec §6.2): proof-of-delivery feed, newest first. */
export default function ActivityScreen() {
  const { t } = useTranslation();
  // Poll while the feed is open so simulated status progression is visible.
  const orders = useOrders('sender', 5000);
  const recipients = useRecipients();

  const nameFor = (o: Order) =>
    recipients.data?.find((r) => r.id === o.recipientId)?.name ?? '';
  const templateFor = (o: Order) => buildPackageTemplates().find((tp) => tp.id === o.templateId);

  return (
    <Screen>
      <ScreenHeader title={t('sender.activityTitle')} />
      {orders.isPending ? (
        <CardListSkeleton count={3} />
      ) : orders.isError ? (
        <ErrorState onRetry={() => orders.refetch()} />
      ) : (orders.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="image"
          title={t('sender.activityEmptyTitle')}
          body={t('sender.activityEmptyBody')}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {(orders.data ?? []).map((order, index) => (
            <FeedEntry
              key={order.id}
              order={order}
              index={index}
              recipientName={nameFor(order)}
              packageName={templateFor(order)?.name ?? ''}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function FeedEntry({
  order,
  index,
  recipientName,
  packageName,
}: {
  order: Order;
  index: number;
  recipientName: string;
  packageName: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 12)).current;

  // Soft entrance, staggered (spec: "soft entrance animations, warm imagery").
  useEffect(() => {
    if (reducedMotion) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index, 6) * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index, 6) * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, reducedMotion, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card
        onPress={() => router.push({ pathname: '/(sender)/order/[id]', params: { id: order.id } })}
        accessibilityLabel={`${recipientName}, ${packageName}, ${order.status}`}
      >
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text variant="title">{recipientName}</Text>
              <Text variant="body" color="secondary">
                {packageName}
              </Text>
              <Text variant="caption" color="muted">
                {friendlyWhen(order.createdAt, t)}
              </Text>
            </View>
            <StatusChip status={order.status} />
          </View>

          {order.status === 'collected' && order.proof && (
            <View style={{ gap: spacing.xs }}>
              <Image
                source={{ uri: order.proof.photoUrl }}
                accessibilityLabel={t('sender.proofTitle')}
                style={{
                  width: '100%',
                  aspectRatio: 16 / 9,
                  borderRadius: radius.md,
                  backgroundColor: colors.border,
                }}
              />
              {order.proof.note != null && order.proof.note !== '' && (
                <Text variant="body" color="secondary" style={{ fontStyle: 'italic' }}>
                  “{order.proof.note}”
                </Text>
              )}
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}
