import { useRouter } from 'expo-router';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BottomSheet,
  Button,
  Screen,
  ScreenHeader,
  Text,
  TextField,
  toast,
} from '@/components';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

interface Country {
  iso: 'KE' | 'US' | 'GB' | 'AE' | 'TZ' | 'UG';
  dial: string;
  flag: string;
  name: string;
}

const COUNTRIES: Country[] = [
  { iso: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { iso: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { iso: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda' },
  { iso: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { iso: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { iso: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
];

/** Phone entry (spec §6.1): country picker, big numeric field, E.164 validation. */
export default function PhoneEntry() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const intendedRole = useAuthStore((s) => s.intendedRole);
  const setPendingPhone = useAuthStore((s) => s.setPendingPhone);
  const setOtpRequestId = useAuthStore((s) => s.setOtpRequestId);

  // Senders are usually abroad; recipients/vendors are local — pick a
  // sensible default country per role (device-region detection in Phase 4).
  const [country, setCountry] = useState<Country>(
    intendedRole === 'sender' ? COUNTRIES[3] : COUNTRIES[0]
  );
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const e164 = useMemo(() => {
    const parsed = parsePhoneNumberFromString(country.dial + digits.replace(/\D/g, ''));
    return parsed?.isValid() ? parsed.number : null;
  }, [country, digits]);

  const submit = async () => {
    if (!e164) {
      setError(t('phone.invalid'));
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      const { requestId } = await api.requestOtp(e164);
      setPendingPhone(e164);
      setOtpRequestId(requestId);
      router.push('/(auth)/otp-verify');
    } catch {
      toast(t('common.errorNoConnection'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      footer={<Button label={t('common.continue')} onPress={submit} loading={submitting} />}
    >
      <ScreenHeader title="" />
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="h1">{t('phone.title')}</Text>
        <Text variant="body" color="secondary">
          {t('phone.reassurance')}
        </Text>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('phone.countryCode')}
            onPress={() => setPickerOpen(true)}
            style={[
              styles.country,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <Text variant="body">{country.flag}</Text>
            <Text variant="bodyStrong">{country.dial}</Text>
          </Pressable>
          <View style={styles.field}>
            <TextField
              placeholder={t('phone.placeholder')}
              keyboardType="phone-pad"
              value={digits}
              onChangeText={(v) => {
                setDigits(v);
                setError(undefined);
              }}
              errorText={error}
              autoFocus
            />
          </View>
        </View>
      </View>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text variant="title">{t('phone.countryCode')}</Text>
        {COUNTRIES.map((c) => (
          <Pressable
            key={c.iso}
            accessibilityRole="button"
            accessibilityLabel={`${c.name} ${c.dial}`}
            onPress={() => {
              setCountry(c);
              setPickerOpen(false);
            }}
            style={[styles.countryRow, { borderBottomColor: theme.colors.border }]}
          >
            <Text variant="body">
              {c.flag}  {c.name}
            </Text>
            <Text variant="bodyStrong" color="secondary">
              {c.dial}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    minHeight: 56,
    borderWidth: 1.5,
  },
  field: { flex: 1 },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
});
