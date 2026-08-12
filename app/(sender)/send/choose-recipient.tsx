import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Card,
  CardListSkeleton,
  EmptyState,
  ErrorState,
  Screen,
  ScreenHeader,
  Text,
} from '@/components';
import { useRecipients } from '@/hooks/queries';
import { useSendFlow } from '@/store/sendFlow';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Send flow step 1: single tap selects and advances (spec §6.2). */
export default function ChooseRecipientScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const recipients = useRecipients();
  const start = useSendFlow((s) => s.start);

  return (
    <Screen>
      <ScreenHeader title={t('sender.chooseRecipientTitle')} back />
      {recipients.isPending ? (
        <CardListSkeleton />
      ) : recipients.isError ? (
        <ErrorState onRetry={() => recipients.refetch()} />
      ) : (recipients.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="users"
          title={t('sender.emptyTitle')}
          ctaLabel={t('sender.emptyCta')}
          onCta={() => router.push('/(sender)/add-recipient')}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {(recipients.data ?? []).map((r) => (
            <Card
              key={r.id}
              onPress={() => {
                start(r);
                router.push('/(sender)/send/choose-package');
              }}
              accessibilityLabel={`${r.name}, ${r.relationship}, ${r.town}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Avatar name={r.name} />
                <View style={{ flex: 1 }}>
                  <Text variant="title">{r.name}</Text>
                  <Text variant="body" color="secondary">
                    {t(`auth.relationships.${r.relationship}`, { defaultValue: r.relationship })}
                    {r.town ? ` · ${r.town}` : ''}
                  </Text>
                </View>
                <Feather name="chevron-right" size={22} color={colors.textMuted} />
              </View>
            </Card>
          ))}
          <Card onPress={() => router.push('/(sender)/add-recipient')} accessibilityLabel={t('sender.addRecipient')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Feather name="plus-circle" size={26} color={colors.primary} />
              <Text variant="bodyStrong" color="brand">
                {t('sender.addRecipient')}
              </Text>
            </View>
          </Card>
        </View>
      )}
    </Screen>
  );
}
