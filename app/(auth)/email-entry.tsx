import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button, Screen, ScreenHeader, TextField, useToast } from '@/components';
import { api } from '@/api';
import { useAuth } from '@/store/auth';

const emailSchema = z.string().trim().email();

/** Account verification is email + one-time code (replaces phone/SMS OTP). */
export default function EmailEntryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const setPendingEmail = useAuth((s) => s.setPendingEmail);

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(t('auth.emailInvalid'));
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const normalized = parsed.data.toLowerCase();
      const { requestId } = await api.requestOtp(normalized);
      setPendingEmail(normalized, requestId);
      router.push('/(auth)/otp-verify');
    } catch {
      toast.show(t('common.genericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen footer={<Button label={t('common.continue')} onPress={submit} loading={loading} />}>
      <ScreenHeader title={t('auth.emailTitle')} subtitle={t('auth.emailReassure')} back />
      <TextField
        label={t('auth.emailPlaceholder')}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        autoFocus
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          setError(undefined);
        }}
        error={error}
        onSubmitEditing={submit}
      />
    </Screen>
  );
}
