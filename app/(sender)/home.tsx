import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Card,
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Screen,
  Text,
} from '@/components';
import { useOrders, useRecipients } from '@/hooks/queries';
import { friendlyWhen } from '@/lib/dates';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { useSendFlow } from '@/store/sendFlow';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Recipient } from '@/api/types';

function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function SenderHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const recipients = useRecipients();
  const orders = useOrders('sender');
  const startFlow = useSendFlow((s) => s.start);

  const lastReceivedFor = (r: Recipient): string | null => {
    const collected = (orders.data ?? []).filter(
      (o) => o.recipientId === r.id && o.status === 'collected' && o.proof
    );
    if (collected.length === 0) return null;
    return friendlyWhen(collected[0]!.proof!.collectedAt, t);
  };

  const proofs = (orders.data ?? []).filter((o) => o.proof?.photoUrl).slice(0, 2);

  const openSend = (recipient?: Recipient) => {
    track('send_flow_started', { from: recipient ? 'recipient_card' : 'cta' });
    if (recipient) {
      startFlow(recipient);
      router.push('/(sender)/send/choose-package');
    } else {
      router.push('/(sender)/send/choose-recipient');
    }
  };

  return (
    <Screen
      footer={
        (recipients.data?.length ?? 0) > 0 ? (
          <Button label={t('sender.sendCta')} onPress={() => openSend()} />
        ) : undefined
      }
    >
      <Text variant="h1" style={{ marginBottom: spacing.xl }}>
        {t(`sender.${greetingKey()}`, { name: user?.name?.split(' ')[0] ?? '' })}
      </Text>

      {recipients.isPending ? (
        <CardListSkeleton count={2} />
      ) : recipients.isError ? (
        <ErrorState onRetry={() => recipients.refetch()} />
      ) : (recipients.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="users"
          title={t('sender.emptyTitle')}
          body={t('sender.emptyBody')}
          ctaLabel={t('sender.emptyCta')}
          onCta={() => router.push('/(sender)/add-recipient')}
        />
      ) : (
        <View style={{ gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Text variant="title">{t('sender.yourPeople')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {(recipients.data ?? []).map((r) => {
                const when = lastReceivedFor(r);
                return (
                  <Card
                    key={r.id}
                    onPress={() => openSend(r)}
                    accessibilityLabel={`${r.name}, ${r.relationship}`}
                    style={{ width: 168, alignItems: 'center', gap: spacing.xs }}
                  >
                    <Avatar name={r.name} size={56} />
                    <Text variant="bodyStrong" align="center" numberOfLines={1}>
                      {r.name}
                    </Text>
                    <Text variant="caption" color="secondary" align="center">
                      {t(`auth.relationships.${r.relationship}`, { defaultValue: r.relationship })}
                    </Text>
                    <Text variant="caption" color="muted" align="center" numberOfLines={1}>
                      {when ? t('sender.lastReceived', { when }) : t('sender.neverReceived')}
                    </Text>
                  </Card>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('sender.addRecipient')}
                onPress={() => router.push('/(sender)/add-recipient')}
                style={{
                  width: 120,
                  borderRadius: radius.lg,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                  padding: spacing.md,
                }}
              >
                <Feather name="plus" size={24} color={colors.primary} />
                <Text variant="caption" color="brand" align="center">
                  {t('sender.addRecipient')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>

          {proofs.length > 0 && (
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="title">{t('sender.recentProof')}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.seeAll')}
                  onPress={() => router.push('/(sender)/activity')}
                  hitSlop={12}
                >
                  <Text variant="bodyStrong" color="brand">
                    {t('common.seeAll')}
                  </Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {proofs.map((o) => (
                  <Pressable
                    key={o.id}
                    accessibilityRole="button"
                    accessibilityLabel={t('sender.viewProof')}
                    onPress={() => router.push({ pathname: '/(sender)/order/[id]', params: { id: o.id } })}
                    style={{ flex: 1 }}
                  >
                    <Image
                      source={{ uri: o.proof!.photoUrl }}
                      style={{
                        width: '100%',
                        aspectRatio: 4 / 3,
                        borderRadius: radius.md,
                        backgroundColor: colors.border,
                      }}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
