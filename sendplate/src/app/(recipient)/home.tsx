import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BigActionButton,
  BottomSheet,
  Card,
  EmptyState,
  PackageGlyph,
  Screen,
  SkeletonCard,
  StatusChip,
  Text,
} from '@/components';
import { api } from '@/lib/api';
import { daysUntil, friendlyWhen } from '@/lib/dates';
import { cachedFetch } from '@/lib/storage';
import { Order, Vendor } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Recipient Home (spec §6.3): get to "show my code" in one tap, even
 * offline — active credits and the vendor list are served from cache when
 * there's no signal.
 */
export default function RecipientHome() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [vendorsOpen, setVendorsOpen] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'recipient'],
    queryFn: () => cachedFetch('orders.recipient', () => api.getOrders('recipient')),
    refetchInterval: 20_000,
  });
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => cachedFetch('vendors', () => api.getVendors()),
  });

  const orders = ordersQuery.data ?? [];
  const active = orders.filter((o) => o.status === 'ready' || o.status === 'paid');
  const recent = orders.filter((o) => o.status === 'collected').slice(0, 2);
  const primaryOrder = active[0];

  return (
    <Screen offlineMessage={t('common.offlineCodeBanner')}>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm }}>
        <Text variant="h1">{t('common.appName')}</Text>

        {ordersQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : active.length === 0 ? (
          <EmptyState title={t('recipientHome.emptyTitle')} body={t('recipientHome.emptyBody')} />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {active.map((order) => (
              <ActiveCreditCard key={order.id} order={order} />
            ))}
          </View>
        )}

        {primaryOrder ? (
          <BigActionButton
            label={t('recipientHome.showMyCode')}
            icon="grid"
            onPress={() =>
              router.push({ pathname: '/code/[id]', params: { id: primaryOrder.id } })
            }
            accessibilityHint={t('code.instructions')}
          />
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('recipientHome.whereCanIUse')}
          onPress={() => setVendorsOpen(true)}
          style={styles.whereLink}
          hitSlop={8}
        >
          <Feather name="map-pin" size={18} color={theme.colors.info} />
          <Text variant="bodyStrong" style={{ color: theme.colors.info }}>
            {t('recipientHome.whereCanIUse')}
          </Text>
        </Pressable>

        {recent.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            {recent.map((order) => (
              <Card key={order.id}>
                <View style={styles.recentRow}>
                  <PackageGlyph glyph={order.glyph} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{order.templateName}</Text>
                    <Text variant="caption" color="muted">
                      {t('recipientHome.collectedOn', {
                        when: order.proof ? friendlyWhen(order.proof.collectedAt) : '',
                      })}
                    </Text>
                  </View>
                  <Feather name="check-circle" size={22} color={theme.colors.success} />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </View>

      <BottomSheet visible={vendorsOpen} onClose={() => setVendorsOpen(false)}>
        <Text variant="title">{t('recipientHome.whereCanIUse')}</Text>
        {(vendorsQuery.data ?? []).map((vendor) => (
          <VendorRow key={vendor.id} vendor={vendor} />
        ))}
      </BottomSheet>
    </Screen>
  );
}

function ActiveCreditCard({ order }: { order: Order }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const days = daysUntil(order.expiresAt);

  return (
    <Card
      onPress={() => router.push({ pathname: '/code/[id]', params: { id: order.id } })}
      accessibilityLabel={`${order.templateName}. ${t('recipientHome.readyToCollect')}`}
      accessibilityHint={t('recipientHome.showMyCode')}
    >
      <View style={styles.creditRow}>
        <View style={[styles.creditGlyph, { backgroundColor: theme.colors.bg, borderRadius: theme.radius.md }]}>
          <PackageGlyph glyph={order.glyph} size={56} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text variant="title">{order.templateName}</Text>
          <Text variant="body" color="secondary">
            {t('recipientHome.fromName', { name: order.senderName })}
          </Text>
          <StatusChip status={order.status} label={t('recipientHome.readyToCollect')} />
          <Text variant="caption" color="muted">
            {days <= 1 ? t('recipientHome.collectToday') : t('recipientHome.collectWithin', { days })}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const iconByType: Record<Vendor['type'], keyof typeof Feather.glyphMap> = {
    food: 'shopping-cart',
    market: 'shopping-bag',
    pharmacy: 'plus-square',
    clinic: 'activity',
  };
  return (
    <View style={[styles.vendorRow, { borderBottomColor: theme.colors.border }]}>
      <View style={[styles.vendorIcon, { backgroundColor: theme.colors.accentTint }]}>
        <Feather name={iconByType[vendor.type]} size={20} color={theme.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong">{vendor.name}</Text>
        <Text variant="caption" color="secondary">
          {vendor.address} · {vendor.hours}
        </Text>
      </View>
      {vendor.distanceKm != null ? (
        <Text variant="caption" color="muted">
          {t('health.kmAway', { km: vendor.distanceKm })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  creditRow: { flexDirection: 'row', gap: 14 },
  creditGlyph: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whereLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vendorIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
