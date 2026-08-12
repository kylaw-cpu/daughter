import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  EmptyState,
  PackageGlyph,
  ProofPhoto,
  Screen,
  SkeletonCard,
  StatusChip,
  Text,
} from '@/components';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { api } from '@/lib/api';
import { friendlyWhen } from '@/lib/dates';
import { cachedFetch } from '@/lib/storage';
import { Order } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Activity — the proof-of-delivery feed (spec §6.2). The trust payoff:
 * newest first, warm imagery, clear "Collected" moments with soft entrance
 * animations.
 */
export default function Activity() {
  const theme = useTheme();
  const { t } = useTranslation();

  const ordersQuery = useQuery({
    queryKey: ['orders', 'sender'],
    queryFn: () => cachedFetch('orders.sender', () => api.getOrders('sender')),
    refetchInterval: 15_000,
  });

  const orders = (ordersQuery.data ?? []).filter((o) => o.status !== 'created');

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.screen, paddingTop: theme.spacing.md }}>
        <Text variant="h1">{t('activity.title')}</Text>
      </View>
      {ordersQuery.isLoading ? (
        <View style={{ padding: theme.spacing.screen, gap: theme.spacing.sm }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : orders.length === 0 ? (
        <EmptyState title={t('activity.emptyTitle')} body={t('activity.emptyBody')} icon="camera" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={ordersQuery.isRefetching}
          onRefresh={() => ordersQuery.refetch()}
          contentContainerStyle={{
            padding: theme.spacing.screen,
            gap: theme.spacing.sm,
            paddingBottom: 32,
          }}
          renderItem={({ item, index }) => <ActivityEntry order={item} index={index} />}
        />
      )}
    </Screen>
  );
}

function ActivityEntry({ order, index }: { order: Order; index: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 12)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        delay: Math.min(index, 6) * 60,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        delay: Math.min(index, 6) * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY, reducedMotion]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card
        padded={false}
        onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
        accessibilityLabel={`${order.recipientName}, ${order.templateName}, ${t(`activity.status.${order.status}`)}`}
      >
        {order.status === 'collected' && order.proof ? (
          <ProofPhoto photoUrl={order.proof.photoUrl} height={140} radius={theme.radius.lg} />
        ) : null}
        <View style={[styles.entryBody, { padding: theme.spacing.md }]}>
          <PackageGlyph glyph={order.glyph} size={44} />
          <View style={styles.entryText}>
            <Text variant="bodyStrong">
              {order.recipientName} · {order.templateName}
            </Text>
            <Text variant="caption" color="muted">
              {friendlyWhen(order.proof?.collectedAt ?? order.createdAt)}
            </Text>
            {order.status === 'collected' && order.proof ? (
              <Text variant="caption" color="secondary">
                {t('activity.collectedBy', { vendor: order.proof.vendorName })}
              </Text>
            ) : null}
          </View>
          <StatusChip status={order.status} label={t(`activity.status.${order.status}`)} />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  entryBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryText: { flex: 1, gap: 2 },
});
