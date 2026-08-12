import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, OtpInput, Screen, ScreenHeader, Text, toast } from '@/components';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

const RESEND_SECONDS = 30;

/**
 * OTP verify (spec §6.1): 6 digit boxes with auto-advance + auto-submit,
 * shake + red on wrong code, 30s resend timer, "Change number" link.
 * (SMS auto-read comes via the OS textContentType/autoComplete hints.)
 */
export default function OtpVerify() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { pendingPhone, otpRequestId, intendedRole, setOtpRequestId, signIn } = useAuthStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verify = async (fullCode: string) => {
    if (!otpRequestId || verifying) return;
    setVerifying(true);
    setError(false);
    try {
      const { token, user } = await api.verifyOtp(
        otpRequestId,
        fullCode,
        intendedRole,
        i18n.language
      );
      await signIn(user, token);
      router.replace('/(auth)/profile-setup');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVALID_OTP') {
        setError(true);
        setCode('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else {
        toast(t('common.errorNoConnection'), 'error');
      }
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    try {
      const { requestId } = await api.requestOtp(pendingPhone);
      setOtpRequestId(requestId);
      setSecondsLeft(RESEND_SECONDS);
    } catch {
      toast(t('common.errorNoConnection'), 'error');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="" />
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="h1">{t('otp.title')}</Text>
        <Text variant="body" color="secondary">
          {t('otp.sentTo', { phone: pendingPhone })}
        </Text>

        <View style={{ marginVertical: theme.spacing.md }}>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError(false);
            }}
            onComplete={verify}
            error={error}
            accessibilityLabel={t('otp.title')}
          />
        </View>

        {error ? (
          <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
            {t('otp.wrong')}
          </Text>
        ) : null}

        <Text variant="caption" color="muted" align="center">
          {t('otp.hint')}
        </Text>

        {secondsLeft > 0 ? (
          <Text variant="body" color="muted" align="center">
            {t('otp.resendIn', { seconds: secondsLeft })}
          </Text>
        ) : (
          <Button label={t('otp.resend')} variant="ghost" onPress={resend} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('otp.changeNumber')}
          onPress={() => router.back()}
          style={{ alignSelf: 'center', padding: 12, minHeight: 44, justifyContent: 'center' }}
        >
          <Text variant="bodyStrong" color="brand">
            {t('otp.changeNumber')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
