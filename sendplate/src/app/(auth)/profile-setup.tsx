import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  PinInput,
  Screen,
  ScreenHeader,
  Text,
  TextField,
  toast,
} from '@/components';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

type Step = 'profile' | 'pin' | 'pinConfirm';

const RELATIONSHIP_KEYS = [
  'mother',
  'father',
  'sister',
  'brother',
  'grandmother',
  'child',
  'friend',
] as const;

/**
 * Profile setup (spec §6.1): name (+ first recipient for senders), then a
 * 4-digit PIN stored only as a salted hash on-device (spec §13).
 */
export default function ProfileSetup() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, setUser, setPin, hasPin } = useAuthStore();
  const role = user?.role ?? 'sender';

  const [step, setStep] = useState<Step>('profile');
  const [name, setName] = useState(user?.name ?? '');
  const [recName, setRecName] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recRelationship, setRecRelationship] = useState<string>('mother');
  const [recTown, setRecTown] = useState('');
  const [needsRecipient, setNeedsRecipient] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState(false);
  const [saving, setSaving] = useState(false);

  // Returning users on this device (name + PIN already set) go straight home.
  useEffect(() => {
    if (user?.name && hasPin) {
      router.replace('/');
      return;
    }
    if (role === 'sender') {
      api
        .getRecipients()
        .then((list) => setNeedsRecipient(list.length === 0))
        .catch(() => setNeedsRecipient(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileValid = useMemo(() => {
    if (!name.trim()) return false;
    if (role === 'sender' && needsRecipient) {
      return !!(recName.trim() && recPhone.trim() && recTown.trim());
    }
    return true;
  }, [name, role, needsRecipient, recName, recPhone, recTown]);

  const finish = async (confirmedPin: string) => {
    if (confirmedPin !== pin1) {
      setPinError(true);
      setPin2('');
      return;
    }
    setSaving(true);
    try {
      const pinHash = await setPin(confirmedPin);
      await api.setPin(pinHash);
      const updated = await api.updateMe({ name: name.trim(), language: i18n.language });
      if (role === 'sender' && needsRecipient) {
        await api.createRecipient({
          name: recName.trim(),
          phone: recPhone.trim(),
          relationship: recRelationship,
          town: recTown.trim(),
          language: i18n.language,
        });
      }
      setUser(updated);
      router.replace('/');
    } catch {
      toast(t('common.errorGeneric'), 'error');
      setSaving(false);
    }
  };

  if (step === 'profile') {
    return (
      <Screen
        footer={
          <Button
            label={t('common.continue')}
            onPress={() => setStep('pin')}
            disabled={!profileValid}
          />
        }
      >
        <ScreenHeader title="" />
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="h1">{t('profileSetup.title')}</Text>
          <TextField
            label={t('profileSetup.yourName')}
            placeholder={t('profileSetup.nameplaceholder')}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          {role === 'sender' && needsRecipient ? (
            <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
              <Text variant="h2">{t('profileSetup.firstRecipientTitle')}</Text>
              <Text variant="body" color="secondary">
                {t('profileSetup.firstRecipientSubtitle')}
              </Text>
              <TextField
                label={t('profileSetup.recipientName')}
                value={recName}
                onChangeText={setRecName}
              />
              <TextField
                label={t('profileSetup.recipientPhone')}
                keyboardType="phone-pad"
                value={recPhone}
                onChangeText={setRecPhone}
              />
              <View style={{ gap: 8 }}>
                <Text variant="bodyStrong" color="secondary">
                  {t('profileSetup.relationship')}
                </Text>
                <View style={styles.chipRow}>
                  {RELATIONSHIP_KEYS.map((key) => {
                    const active = recRelationship === key;
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={t(`profileSetup.relationships.${key}`)}
                        onPress={() => setRecRelationship(key)}
                        style={[
                          styles.chip,
                          {
                            borderRadius: theme.radius.pill,
                            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        <Text
                          variant="bodyStrong"
                          style={{
                            color: active ? theme.colors.textOnPrimary : theme.colors.textPrimary,
                          }}
                        >
                          {t(`profileSetup.relationships.${key}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <TextField
                label={t('profileSetup.town')}
                placeholder={t('profileSetup.townPlaceholder')}
                value={recTown}
                onChangeText={setRecTown}
              />
            </View>
          ) : null}
        </View>
      </Screen>
    );
  }

  const isConfirm = step === 'pinConfirm';
  return (
    <Screen>
      <ScreenHeader title="" onBack={() => (isConfirm ? setStep('pin') : setStep('profile'))} />
      <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
        <Text variant="h1" align="center">
          {isConfirm ? t('profileSetup.pinConfirm') : t('profileSetup.pinTitle')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('profileSetup.pinSubtitle')}
        </Text>
        <View style={{ marginVertical: theme.spacing.lg }}>
          {isConfirm ? (
            <PinInput
              key="confirm"
              value={pin2}
              onChange={(v) => {
                setPin2(v);
                setPinError(false);
              }}
              onComplete={finish}
              error={pinError}
              accessibilityLabel={t('profileSetup.pinConfirm')}
            />
          ) : (
            <PinInput
              key="set"
              value={pin1}
              onChange={setPin1}
              onComplete={() => {
                setPin2('');
                setStep('pinConfirm');
              }}
              accessibilityLabel={t('profileSetup.pinTitle')}
            />
          )}
        </View>
        {pinError ? (
          <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
            {t('profileSetup.pinMismatch')}
          </Text>
        ) : null}
        {saving ? (
          <Text variant="body" color="muted" align="center">
            {t('common.loading')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 44,
    justifyContent: 'center',
  },
});
