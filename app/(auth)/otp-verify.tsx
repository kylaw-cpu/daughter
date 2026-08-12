import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, OtpInput, Screen, ScreenHeader, Text } from '@/components';
import { api } from '@/api';
import { useAuth } from '@/store/auth';
import { spacing, touchTarget } from '@/theme/theme';

const RESEND_SECONDS = 30;

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { pendingPhone, otpRequestId, setPendingPhone, saveToken, setUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  // Auto-submit when all 6 digits are in (spec §6.1).
  const verify = async (value: string) => {
    if (verifying) return;
    setVerifying(true);
    setError(false);
    try {
      const { token, user } = await api.verifyOtp(otpRequestId ?? '', value);
      await saveToken(token);
      if (user) {
        // Returning account on this phone: straight to their home.
        await setUser(user);
        router.replace('/');
      } else {
        router.replace('/(auth)/profile-setup');
      }
    } catch {
      setError(true);
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (!pendingPhone) return;
    setCountdown(RESEND_SECONDS);
    try {
      const { requestId } = await api.requestOtp(pendingPhone);
      setPendingPhone(pendingPhone, requestId);
    } catch {
      // Quietly allow another tap; the timer already reset.
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('auth.otpTitle')}
        subtitle={t('auth.otpSentTo', { phone: pendingPhone ?? '' })}
        back
      />
      <View style={{ gap: spacing.xl, marginTop: spacing.md }}>
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(false);
          }}
          onComplete={verify}
          error={error}
          accessibilityLabel={t('auth.otpTitle')}
        />
        {error && (
          <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
            {t('auth.otpWrong')}
          </Text>
        )}
        {verifying && (
          <Text variant="body" color="secondary" align="center">
            {t('common.loading')}
          </Text>
        )}
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          {countdown > 0 ? (
            <Text variant="body" color="muted">
              {t('auth.otpResendIn', { seconds: countdown })}
            </Text>
          ) : (
            <Button
              label={t('auth.otpResend')}
              variant="ghost"
              fullWidth={false}
              onPress={resend}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.changeNumber')}
            onPress={() => router.back()}
            style={{ minHeight: touchTarget, justifyContent: 'center' }}
          >
            <Text variant="bodyStrong" color="brand">
              {t('auth.changeNumber')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
