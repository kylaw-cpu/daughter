import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card, EmptyState, Screen, ScreenHeader, Text } from '@/components';
import { useOrders } from '@/hooks/queries';
import { buildPackageTemplates } from '@/api/mockData';
import { friendlyWhen } from '@/lib/dates';
import { useOfflineQueue } from '@/store/offlineQueue';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Vendor history (spec §6.4): date, package, sync status. */
export default function VendorHistoryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queue = useOfflineQueue((s) => s.items);
  // The mock has no vendor-scoped endpoint; collected orders stand in for
  // this vendor's redemptions until the real backend adds one (Phase 4).
  const orders = useOrders('sender');

  const collected = (orders.data ?? []).filter((o) => o.status === 'collected');
  const pendingQueue = queue.filter((q) => !q.synced);
  const templates = buildPackageTemplates();

  const rows = [
    ...pendingQueue.map((q) => ({
      id: `queued-${q.orderId}`,
      title: q.claimCode,
      subtitle: friendlyWhen(q.queuedAt, t),
      pending: true,
    })),
    ...collected.map((o) => ({
      id: o.id,
      title: templates.find((tp) => tp.id === o.templateId)?.name ?? o.claimCode,
      subtitle: o.proof ? friendlyWhen(o.proof.collectedAt, t) : friendlyWhen(o.createdAt, t),
      pending: false,
    })),
  ];

  return (
    <Screen>
      <ScreenHeader title={t('vendor.historyTitle')} />
      {rows.length === 0 ? (
        <EmptyState icon="list" title={t('vendor.historyEmpty')} />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {rows.map((row) => (
            <Card key={row.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Feather
                  name={row.pending ? 'upload-cloud' : 'check-circle'}
                  size={22}
                  color={row.pending ? colors.warning : colors.success}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{row.title}</Text>
                  <Text variant="caption" color="muted">
                    {row.subtitle}
                  </Text>
                </View>
                <Text variant="caption" style={{ color: row.pending ? colors.warning : colors.success }}>
                  {row.pending ? t('vendor.pending') : t('vendor.synced')}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
