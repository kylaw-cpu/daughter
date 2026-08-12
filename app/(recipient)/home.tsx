import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  BigActionButton,
  Card,
  CardListSkeleton,
  EmptyState,
  ErrorState,
  PackageGlyph,
  Screen,
  Text,
} from '@/components';
import { buildPackageTemplates } from '@/api/mockData';
import { useRecipientOrders, useVendorsWithCache } from '@/hooks/useRecipientData';
import { daysUntil } from '@/lib/dates';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Order } from '@/api/types';

/**
 * Recipient home (spec §6.3): one tap to "show my code", works offline from
 * cache, big type, icons + words. Base font size bumps to 17–18 here.
 */
export default function RecipientHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const { orders, fromCache, isPending, isError, refetch } = useRecipientOrders(8000);
  const { vendors } = useVendorsWithCache();
  const [showVendors, setShowVendors] = useState(false);

  const active = (orders ?? []).filter((o) => o.status === 'ready');
  const relationship = t('auth.relationships.child', { defaultValue: 'family' });

  return (
    <Screen offlineMessage={t('common.offlineCodeBanner')}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.xl }}>
        <Text variant="h1">{user?.name ?? ''} 💛</Text>
        <Text variant="body" color="secondary" style={{ fontSize: 17 }}>
          {t('recipient.fromYour', { relationship })}
        </Text>
      </View>

      {isPending ? (
        <CardListSkeleton count={2} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : active.length === 0 ? (
        <EmptyState
          icon="sunrise"
          title={t('recipient.emptyTitle')}
          body={t('recipient.emptyBody')}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {active.map((order) => (
            <CreditCard key={order.id} order={order} />
          ))}

          <BigActionButton
            label={t('recipient.showMyCode')}
            icon="maximize"
            onPress={() => {
              track('code_shown', { orderId: active[0]!.id, cached: String(fromCache) });
              router.push({ pathname: '/(recipient)/code/[id]', params: { id: active[0]!.id } });
            }}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('recipient.whereToUse')}
            onPress={() => setShowVendors((v) => !v)}
            style={{
              minHeight: touchTarget,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.xs,
            }}
          >
            <Feather name="map-pin" size={18} color={colors.info} />
            <Text variant="bodyStrong" style={{ color: colors.info, fontSize: 17 }}>
              {t('recipient.whereToUse')}
            </Text>
          </Pressable>

          {showVendors && (
            <View style={{ gap: spacing.sm }}>
              <Text variant="title">{t('recipient.vendorsNearby')}</Text>
              {(vendors ?? []).map((v, i) => (
                <Card key={v.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: radius.md,
                        backgroundColor: colors.accentTint,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather
                        name={v.type === 'clinic' ? 'plus-square' : v.type === 'pharmacy' ? 'package' : 'shopping-bag'}
                        size={20}
                        color={colors.accent}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 17 }}>
                        {v.name}
                      </Text>
                      <Text variant="body" color="secondary">
                        {t('recipient.distanceAway', { km: (0.8 + i * 0.7).toFixed(1) })} ·{' '}
                        {t('recipient.openHours', { hours: v.hours })}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

function CreditCard({ order }: { order: Order }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const template = buildPackageTemplates().find((tp) => tp.id === order.templateId);
  const days = daysUntil(order.expiresAt);

  return (
    <Card
      onPress={() => router.push({ pathname: '/(recipient)/code/[id]', params: { id: order.id } })}
      accessibilityLabel={`${template?.name ?? ''}, ${t('recipient.readyToCollect')}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <PackageGlyph glyph={template?.glyph ?? ''} size={64} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="title" style={{ fontSize: 19 }}>
            {template?.name ?? ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xxs }}>
            <Feather name="shopping-bag" size={15} color={colors.warning} />
            <Text variant="bodyStrong" style={{ color: colors.warning, fontSize: 17 }}>
              {t('recipient.readyToCollect')}
            </Text>
          </View>
          <Text variant="body" color="secondary">
            {days === 0 ? t('sender.expiresToday') : t('sender.expiresIn', { count: days })}
          </Text>
        </View>
        <Feather name="chevron-right" size={24} color={colors.textMuted} />
      </View>
    </Card>
  );
}
