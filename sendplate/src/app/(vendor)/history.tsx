import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, EmptyState, Screen, Text } from '@/components';
import { useOnline } from '@/hooks/useOnline';
import { formatDateTime } from '@/lib/dates';
import { PendingRedemption } from '@/models/types';
import { useVendorQueue } from '@/store/vendorQueueStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Vendor history (spec §6.4): redemptions with date, code, and sync
 * status; conflict entries carry a clear resolution message (spec §11).
 */
export default function VendorHistory() {
  const theme = useTheme();
  const { t } = useTranslation();
  const online = useOnline();
  const items = useVendorQueue((s) => s.items);
  const sync = useVendorQueue((s) => s.sync);
  const pending = items.filter((i) => i.status === 'pending').length;

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ paddingHorizontal: theme.spacing.screen, paddingTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Text variant="h1">{t('vendor.historyTitle')}</Text>
        {pending > 0 && online ? (
          <Button label={t('common.pendingSync', { count: pending })} variant="secondary" onPress={sync} />
        ) : null}
      </View>
      {items.length === 0 ? (
        <EmptyState title={t('vendor.historyEmpty')} icon="list" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.screen, gap: theme.spacing.sm }}
          renderItem={({ item }) => <HistoryRow item={item} />}
        />
      )}
    </Screen>
  );
}

function HistoryRow({ item }: { item: PendingRedemption }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const statusConfig: Record<
    PendingRedemption['status'],
    { icon: keyof typeof Feather.glyphMap; color: string; bg: string }
  > = {
    pending: {
      icon: 'upload-cloud',
      color: theme.isDark ? theme.colors.warning : '#8A6404',
      bg: theme.colors.warningTint,
    },
    synced: { icon: 'check-circle', color: theme.colors.success, bg: theme.colors.successTint },
    conflict: { icon: 'alert-triangle', color: theme.colors.danger, bg: theme.colors.dangerTint },
  };
  const cfg = statusConfig[item.status];

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon} size={20} color={cfg.color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{item.claimCode}</Text>
          <Text variant="caption" color="muted">
            {formatDateTime(item.queuedAt)}
          </Text>
          {item.status === 'conflict' ? (
            <Text variant="caption" color="danger">
              {t('vendor.conflictBody')}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" style={{ color: cfg.color }}>
          {t(`vendor.syncStatus.${item.status}`)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
