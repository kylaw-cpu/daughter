import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Text,
  useToast,
} from '@/components';
import { useNudges } from '@/hooks/queries';
import { useVendorsWithCache } from '@/hooks/useRecipientData';
import { track } from '@/analytics/analytics';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { HealthNudge } from '@/api/types';

/**
 * Health tab (spec §6.3): short, actionable, dignified nudges — never
 * preachy, never shaming. Alerts pin to the top as a banner.
 */
export default function HealthScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const nudges = useNudges();
  const { vendors } = useVendorsWithCache();

  const alerts = (nudges.data ?? []).filter((n) => n.priority === 'alert');
  const normal = (nudges.data ?? []).filter((n) => n.priority === 'normal');
  const clinics = (vendors ?? []).filter((v) => v.type === 'clinic' || v.type === 'pharmacy');

  return (
    <Screen>
      <ScreenHeader title={t('recipient.healthTitle')} />

      {nudges.isPending ? (
        <CardListSkeleton count={3} />
      ) : nudges.isError ? (
        <ErrorState onRetry={() => nudges.refetch()} />
      ) : (
        <View style={{ gap: spacing.xl }}>
          {alerts.map((nudge) => (
            <View
              key={nudge.id}
              accessibilityLiveRegion="polite"
              style={{
                backgroundColor: colors.warning,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Feather name="alert-triangle" size={18} color="#241E1A" />
                <Text variant="bodyStrong" style={{ color: '#241E1A' }}>
                  {t('recipient.alertPinned')}
                </Text>
              </View>
              <Text variant="body" style={{ color: '#241E1A', fontSize: 17 }}>
                {nudge.message}
              </Text>
            </View>
          ))}

          <View style={{ gap: spacing.sm }}>
            <Text variant="title">{t('recipient.nudgesTitle')}</Text>
            {normal.length === 0 ? (
              <EmptyState icon="heart" title={t('recipient.emptyTitle')} />
            ) : (
              normal.map((nudge) => <NudgeCard key={nudge.id} nudge={nudge} />)
            )}
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text variant="title">{t('recipient.clinicsTitle')}</Text>
            {clinics.map((v) => (
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
                    <Feather name="plus-square" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 17 }}>
                      {v.name}
                    </Text>
                    <Text variant="body" color="secondary">
                      {v.address} · {t('recipient.openHours', { hours: v.hours })}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function NudgeCard({ nudge }: { nudge: HealthNudge }) {
  const { colors } = useTheme();
  const toast = useToast();
  const { t } = useTranslation();

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather
              name={(nudge.icon as keyof typeof Feather.glyphMap) ?? 'heart'}
              size={20}
              color={colors.primaryDark}
            />
          </View>
          <Text variant="body" style={{ flex: 1, fontSize: 17 }}>
            {nudge.message}
          </Text>
        </View>
        {nudge.action != null && (
          <Button
            label={nudge.action.label}
            variant="secondary"
            onPress={() => {
              track(nudge.action!.type === 'clinic' ? 'clinic_referral_clicked' : 'nudge_tapped', {
                nudge: nudge.id,
              });
              toast.show(t('common.done'), 'success');
            }}
          />
        )}
      </View>
    </Card>
  );
}
