import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen, ScreenHeader } from '@/components';
import { ProfileContent } from '@/components/ProfileContent';

export default function SenderProfileScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader title={t('sender.tabProfile')} />
      <ProfileContent />
    </Screen>
  );
}
