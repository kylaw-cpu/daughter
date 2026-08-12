import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { AsYouType, CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { Button, Screen, ScreenHeader, Text, TextField, useToast } from '@/components';
import { api } from '@/api';
import { useAuth } from '@/store/auth';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

const COUNTRIES: Array<{ code: CountryCode; dial: string; flag: string }> = [
  { code: 'KE', dial: '+254', flag: '🇰🇪' },
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' },
  { code: 'AE', dial: '+971', flag: '🇦🇪' },
  { code: 'SA', dial: '+966', flag: '🇸🇦' },
  { code: 'DE', dial: '+49', flag: '🇩🇪' },
];

export default function PhoneEntryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const setPendingPhone = useAuth((s) => s.setPendingPhone);

  const detected = useMemo<CountryCode>(() => {
    const region = getLocales()[0]?.regionCode as CountryCode | undefined;
    return region && COUNTRIES.some((c) => c.code === region) ? region : 'KE';
  }, []);
  const [country, setCountry] = useState<CountryCode>(detected);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [national, setNational] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const dial = COUNTRIES.find((c) => c.code === country)?.dial ?? '+254';

  const submit = async () => {
    const parsed = parsePhoneNumberFromString(national, country);
    if (!parsed?.isValid()) {
      setError(t('auth.phoneInvalid'));
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const { requestId } = await api.requestOtp(parsed.number);
      setPendingPhone(parsed.number, requestId); // E.164 (spec §6.1)
      router.push('/(auth)/otp-verify');
    } catch {
      toast.show(t('common.genericError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      footer={<Button label={t('common.continue')} onPress={submit} loading={loading} />}
    >
      <ScreenHeader title={t('auth.phoneTitle')} subtitle={t('auth.phoneReassure')} back />
      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${country} ${dial}`}
          onPress={() => setPickerOpen((v) => !v)}
          style={{
            minHeight: 52,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            justifyContent: 'center',
          }}
        >
          <Text variant="bodyStrong">
            {COUNTRIES.find((c) => c.code === country)?.flag} {dial}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <TextField
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            autoFocus
            value={new AsYouType(country).input(national)}
            onChangeText={(text) => {
              setNational(text.replace(/[^\d+ ()-]/g, ''));
              setError(undefined);
            }}
            error={error}
            textContentType="telephoneNumber"
          />
        </View>
      </View>

      {pickerOpen && (
        <View
          style={{
            marginTop: spacing.sm,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              accessibilityLabel={`${c.code} ${c.dial}`}
              onPress={() => {
                setCountry(c.code);
                setPickerOpen(false);
              }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                minHeight: 48,
                justifyContent: 'center',
                backgroundColor: pressed || c.code === country ? colors.primaryTint : 'transparent',
              })}
            >
              <Text variant="body">
                {c.flag} {c.code} · {c.dial}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
