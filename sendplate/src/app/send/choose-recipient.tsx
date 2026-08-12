import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  SkeletonCard,
  Text,
} from '@/components';
import { api } from '@/lib/api';
import { cachedFetch } from '@/lib/storage';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Send step 1 (spec §6.2): single tap to select and advance. */
export default function ChooseRecipient() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const setRecipient = useSendFlow((s) => s.setRecipient);

  const recipientsQuery = useQuery({
    queryKey: ['recipients'],
    queryFn: () => cachedFetch('recipients', () => api.getRecipients()),
  });

  return (
    <Screen>
      <ScreenHeader title={t('send.chooseRecipientTitle')} />
      <View style={{ gap: theme.spacing.sm }}>
        {recipientsQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : recipientsQuery.isError ? (
          <EmptyState
            title={t('common.errorNoConnection')}
            actionLabel={t('common.retry')}
            onAction={() => recipientsQuery.refetch()}
            icon="wifi-off"
          />
        ) : (
          <>
            {(recipientsQuery.data ?? []).map((recipient) => (
              <Card
                key={recipient.id}
                onPress={() => {
                  setRecipient(recipient);
                  router.push('/send/choose-package');
                }}
                accessibilityLabel={`${recipient.name}, ${recipient.town}`}
              >
                <View style={styles.row}>
                  <Avatar name={recipient.name} size={48} />
                  <View style={{ flex: 1 }}>
                    <Text variant="title">{recipient.name}</Text>
                    <Text variant="caption" color="secondary">
                      {t(`profileSetup.relationships.${recipient.relationship}`, {
                        defaultValue: recipient.relationship,
                      })}{' '}
                      · {recipient.town}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={22} color={theme.colors.textMuted} />
                </View>
              </Card>
            ))}
            <Card
              onPress={() => router.push('/send/add-recipient')}
              accessibilityLabel={t('send.addNewRecipient')}
            >
              <View style={styles.row}>
                <View style={[styles.plus, { backgroundColor: theme.colors.primaryTint }]}>
                  <Feather name="plus" size={22} color={theme.colors.primary} />
                </View>
                <Text variant="bodyStrong" color="brand" style={{ flex: 1 }}>
                  {t('send.addNewRecipient')}
                </Text>
              </View>
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plus: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
