import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ProofPhoto,
  Screen,
  SkeletonCard,
  Text,
} from '@/components';
import { friendlyWhen } from '@/lib/dates';
import { api } from '@/lib/api';
import { cachedFetch } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Sender Home (spec §6.2): see who you support and send in one tap. */
export default function SenderHome() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const resetSendFlow = useSendFlow((s) => s.reset);

  const recipientsQuery = useQuery({
    queryKey: ['recipients'],
    queryFn: () => cachedFetch('recipients', () => api.getRecipients()),
  });
  const ordersQuery = useQuery({
    queryKey: ['orders', 'sender'],
    queryFn: () => cachedFetch('orders.sender', () => api.getOrders('sender')),
    refetchInterval: 15_000, // poll for proof updates (push in Phase 4)
  });

  const hour = new Date().getHours();
  const greetingKey =
    hour < 12 ? 'senderHome.goodMorning' : hour < 18 ? 'senderHome.goodAfternoon' : 'senderHome.goodEvening';

  const recipients = recipientsQuery.data ?? [];
  const collected = (ordersQuery.data ?? []).filter((o) => o.status === 'collected').slice(0, 2);

  const startSend = () => {
    resetSendFlow();
    router.push('/send/choose-recipient');
  };

  return (
    <Screen
      footer={
        recipients.length > 0 ? (
          <Button
            label={t('senderHome.sendNutrition')}
            onPress={startSend}
            icon={<Feather name="send" size={18} color={theme.colors.textOnPrimary} />}
          />
        ) : undefined
      }
    >
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.sm }}>
        <Text variant="h1">{t(greetingKey, { name: user?.name || '' })}</Text>

        {recipientsQuery.isLoading ? (
          <SkeletonCard />
        ) : recipients.length === 0 ? (
          <EmptyState
            title={t('senderHome.emptyTitle')}
            body={t('senderHome.emptyBody')}
            actionLabel={t('senderHome.addSomeone')}
            onAction={startSend}
          />
        ) : (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="title">{t('senderHome.yourPeople')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 4 }}
            >
              {recipients.map((r) => (
                <Card
                  key={r.id}
                  onPress={startSend}
                  accessibilityLabel={`${r.name}, ${t(`profileSetup.relationships.${r.relationship}`, { defaultValue: r.relationship })}`}
                  style={styles.recipientCard}
                >
                  <Avatar name={r.name} size={56} />
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text variant="caption" color="secondary" numberOfLines={1}>
                    {t(`profileSetup.relationships.${r.relationship}`, { defaultValue: r.relationship })}
                  </Text>
                  <Text variant="caption" color="muted" numberOfLines={2} align="center">
                    {r.lastReceivedAt
                      ? t('senderHome.lastReceived', { when: friendlyWhen(r.lastReceivedAt) })
                      : t('senderHome.neverReceived')}
                  </Text>
                </Card>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('senderHome.addSomeone')}
                onPress={() => router.push('/send/add-recipient')}
                style={[
                  styles.addCard,
                  { borderColor: theme.colors.border, borderRadius: theme.radius.lg },
                ]}
              >
                <Feather name="plus" size={28} color={theme.colors.primary} />
                <Text variant="caption" color="brand" align="center">
                  {t('senderHome.addSomeone')}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {collected.length > 0 ? (
          <View style={{ gap: theme.spacing.xs }}>
            <View style={styles.rowBetween}>
              <Text variant="title">{t('senderHome.recentProof')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.seeAll')}
                onPress={() => router.push('/(sender)/activity')}
                hitSlop={8}
              >
                <Text variant="bodyStrong" color="brand">
                  {t('common.seeAll')}
                </Text>
              </Pressable>
            </View>
            {collected.map((order) => (
              <Card
                key={order.id}
                padded={false}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
                accessibilityLabel={`${order.templateName} — ${order.recipientName}`}
              >
                <ProofPhoto photoUrl={order.proof?.photoUrl ?? 'mock://proof/basket'} height={120} radius={theme.radius.lg} />
                <View style={{ padding: theme.spacing.md, gap: 2 }}>
                  <Text variant="bodyStrong">{order.recipientName}</Text>
                  <Text variant="caption" color="secondary">
                    {order.templateName} · {order.proof ? friendlyWhen(order.proof.collectedAt) : ''}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  recipientCard: { width: 140, alignItems: 'center', gap: 4 },
  addCard: {
    width: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
