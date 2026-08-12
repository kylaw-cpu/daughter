import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  SkeletonCard,
  Text,
  toast,
} from '@/components';
import { api } from '@/lib/api';
import { cachedFetch } from '@/lib/storage';
import { HealthNudge, Vendor } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Health tab (spec §6.3): simple nudge cards (icon, one sentence, one
 * action), nearby clinics & health days, and a pinned alert banner when a
 * priority broadcast is active. Non-preachy, dignified, actionable.
 */
export default function Health() {
  const theme = useTheme();
  const { t } = useTranslation();

  const nudgesQuery = useQuery({
    queryKey: ['nudges'],
    queryFn: () => cachedFetch('nudges', () => api.getNudges()),
  });
  const vendorsQuery = useQuery({
    queryKey: ['vendors'],
    queryFn: () => cachedFetch('vendors', () => api.getVendors()),
  });

  const nudges = nudgesQuery.data ?? [];
  const alerts = nudges.filter((n) => n.priority === 'alert');
  const normal = nudges.filter((n) => n.priority !== 'alert');
  const clinics = (vendorsQuery.data ?? []).filter((v) =>
    v.offeredCategories.includes('health')
  );

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm }}>
        <Text variant="h1">{t('health.title')}</Text>

        {alerts.map((alert) => (
          <View
            key={alert.id}
            accessibilityLiveRegion="polite"
            style={[styles.alert, { backgroundColor: theme.colors.dangerTint, borderRadius: theme.radius.md }]}
          >
            <Feather name="alert-triangle" size={20} color={theme.colors.danger} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: theme.colors.danger }}>
                {t('health.alertBanner')}
              </Text>
              <Text variant="body" style={{ color: theme.colors.danger }}>
                {alert.message}
              </Text>
            </View>
          </View>
        ))}

        {nudgesQuery.isLoading ? (
          <SkeletonCard />
        ) : normal.length === 0 && alerts.length === 0 ? (
          <EmptyState title={t('health.emptyTitle')} body={t('health.emptyBody')} icon="heart" />
        ) : (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="title">{t('health.nudgesTitle')}</Text>
            {normal.map((nudge) => (
              <NudgeCard key={nudge.id} nudge={nudge} />
            ))}
          </View>
        )}

        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="title">{t('health.nearbyTitle')}</Text>
          {vendorsQuery.isLoading ? (
            <SkeletonCard />
          ) : (
            clinics.map((clinic) => <ClinicCard key={clinic.id} clinic={clinic} />)
          )}
        </View>
      </View>
    </Screen>
  );
}

function NudgeCard({ nudge }: { nudge: HealthNudge }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.nudgeRow}>
        <View style={[styles.nudgeIcon, { backgroundColor: theme.colors.accentTint }]}>
          <Feather
            name={(nudge.icon as keyof typeof Feather.glyphMap) || 'heart'}
            size={22}
            color={theme.colors.accent}
          />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text variant="body">{nudge.message}</Text>
          {nudge.action ? (
            <Button
              label={nudge.action.label}
              variant="secondary"
              fullWidth={false}
              onPress={() => toast(t('health.reminderSet'), 'success')}
            />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function ClinicCard({ clinic }: { clinic: Vendor }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Card>
      <View style={styles.nudgeRow}>
        <View style={[styles.nudgeIcon, { backgroundColor: theme.colors.infoTint }]}>
          <Feather
            name={clinic.type === 'pharmacy' ? 'plus-square' : 'activity'}
            size={22}
            color={theme.colors.info}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{clinic.name}</Text>
          <Text variant="caption" color="secondary">
            {clinic.address} · {clinic.hours}
          </Text>
        </View>
        {clinic.distanceKm != null ? (
          <Text variant="caption" color="muted">
            {t('health.kmAway', { km: clinic.distanceKm })}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  alert: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  nudgeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nudgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
