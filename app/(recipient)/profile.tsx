import React from 'react';
import { useTranslation } from 'react-i18next';
import { Screen, ScreenHeader } from '@/components';
import { ProfileContent } from '@/components/ProfileContent';

export default function RecipientProfileScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader title={t('recipient.profileTitle')} />
      <ProfileContent showCallForHelp />
    </Screen>
  );
}
