import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  EmptyState,
  PackageCard,
  Screen,
  ScreenHeader,
  SkeletonCard,
  Text,
} from '@/components';
import { api } from '@/lib/api';
import { cachedFetch } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

const FX_RATE = 129.35; // display rate before an order locks its own rate

/**
 * Send step 2 — the signature screen (spec §6.2): concrete, dignified
 * package choices with dual-currency prices and a "Most sent" badge.
 */
export default function ChoosePackage() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const recipient = useSendFlow((s) => s.recipient);
  const setTemplate = useSendFlow((s) => s.setTemplate);

  const packagesQuery = useQuery({
    queryKey: ['packages', recipient?.id, i18n.language],
    queryFn: () => cachedFetch(`packages.${i18n.language}`, () => api.getPackages(recipient?.id ?? '')),
  });

  return (
    <Screen>
      <ScreenHeader title={t('send.choosePackageTitle')} />
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="secondary">
          {t('send.choosePackageSubtitle')}
        </Text>
        {packagesQuery.isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : packagesQuery.isError ? (
          <EmptyState
            title={t('common.errorNoConnection')}
            actionLabel={t('common.retry')}
            onAction={() => packagesQuery.refetch()}
            icon="wifi-off"
          />
        ) : (
          (packagesQuery.data ?? []).map((template) => (
            <PackageCard
              key={template.id}
              template={template}
              senderCurrency={user?.currency ?? 'USD'}
              localCurrency="KES"
              fxRate={FX_RATE}
              onPress={() => {
                setTemplate(template);
                router.push('/send/customize');
              }}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
