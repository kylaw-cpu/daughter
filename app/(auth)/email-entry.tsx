import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button, Screen, ScreenHeader, TextField, useToast } from '@/components';
import { api } from '@/api';
import { useAuth } from '@/store/auth';

const emailSchema = z.string().trim().email();

/**
 * Self-contained sign-in: the email is the account identity on this device
 * and the 4-digit PIN is the security. No verification email is sent —
 * that would require a third-party mail service (deliberately avoided).
 */
export default function EmailEntryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();
  const setPendingEmail = useAuth((s) => s.setPendingEmail);
  const setUser = useAuth((s) => s.setUser);

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
    const normalized = parsed.data.toLowerCase();
    setPendingEmail(normalized);
    try {
      // Returning account on this device: straight back in (PIN gate still
      // applies at launch); otherwise continue to profile setup.
      const existing = await api.getMe().catch(() => null);
      if (existing && existing.email === normalized) {
        await setUser(existing);
        router.replace('/');
      } else {
        router.push('/(auth)/profile-setup');
      }
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
