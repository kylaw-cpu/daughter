import React from 'react';
import { View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  CardListSkeleton,
  ErrorState,
  PackageCard,
  Screen,
  ScreenHeader,
} from '@/components';
import { FX_RATE, LOCAL_CURRENCY } from '@/api/mockData';
import { usePackages } from '@/hooks/queries';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { useSendFlow } from '@/store/sendFlow';
import { spacing } from '@/theme/theme';

/** Send flow step 2 — the signature screen (spec §6.2). */
export default function ChoosePackageScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuth((s) => s.user);
  const recipient = useSendFlow((s) => s.recipient);
  const chooseTemplate = useSendFlow((s) => s.chooseTemplate);
  const packages = usePackages(recipient?.id);

  if (!recipient) return <Redirect href="/(sender)/send/choose-recipient" />;

  return (
    <Screen>
      <ScreenHeader
        title={t('sender.choosePackageTitle')}
        subtitle={t('sender.choosePackageSubtitle', { name: recipient.name })}
        back
      />
      {packages.isPending ? (
        <CardListSkeleton count={4} />
      ) : packages.isError ? (
        <ErrorState onRetry={() => packages.refetch()} />
      ) : (
        <View style={{ gap: spacing.md }}>
          {(packages.data ?? []).map((template) => (
            <PackageCard
              key={template.id}
              template={template}
              priceSender={Math.round(template.basePriceLocal / FX_RATE)}
              senderCurrency={user?.currency ?? 'USD'}
              localCurrency={LOCAL_CURRENCY}
              onPress={() => {
                chooseTemplate(template);
                track('package_selected', { template: template.key });
                router.push('/(sender)/send/customize');
              }}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
