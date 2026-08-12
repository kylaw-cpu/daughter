import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, PinInput, Screen, Text } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * PIN unlock gate shown on each app launch for signed-in users (spec §6.1:
 * the PIN "opens the app"). Biometric unlock can be layered on in Phase 4.
 */
export default function Unlock() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, verifyPin, setUnlocked } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const check = async (value: string) => {
    const ok = await verifyPin(value);
    if (ok) {
      setUnlocked(true);
      router.replace('/');
    } else {
      setError(true);
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  return (
    <Screen offlineBanner={false}>
      <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingTop: 64 }}>
        <Avatar name={user?.name ?? ''} size={72} />
        <Text variant="h2" align="center">
          {user?.name}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('profileSetup.pinTitle')}
        </Text>
        <View style={{ marginTop: theme.spacing.md }}>
          <PinInput
            value={pin}
            onChange={(v) => {
              setPin(v);
              setError(false);
            }}
            onComplete={check}
            error={error}
            accessibilityLabel={t('profileSetup.pinTitle')}
          />
        </View>
        {error ? (
          <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
            {t('otp.wrong')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
