import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, PinInput, Screen, Text } from '@/components';
import { useAuth } from '@/store/auth';
import { spacing } from '@/theme/theme';

/** PIN gate on launch (spec §6.1). Wrong PIN shakes + haptic via PinInput. */
export default function UnlockScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, verifyPin, setUnlocked } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const check = async (value: string) => {
    if (await verifyPin(value)) {
      setUnlocked(true);
      router.replace('/');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl, alignItems: 'center' }}>
        <Avatar name={user?.name ?? '·'} photoUrl={user?.photoUrl} size={72} />
        <Text variant="h1" align="center">
          {t('auth.unlockTitle')}
        </Text>
        <PinInput
          value={pin}
          onChange={(v) => {
            setPin(v);
            setError(false);
          }}
          onComplete={check}
          error={error}
          accessibilityLabel={t('auth.unlockTitle')}
        />
        {error && (
          <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
            {t('auth.pinMismatch')}
          </Text>
        )}
      </View>
    </Screen>
  );
}
