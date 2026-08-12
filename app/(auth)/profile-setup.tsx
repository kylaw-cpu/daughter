import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, PinInput, Screen, ScreenHeader, Text, TextField, useToast } from '@/components';
import { api } from '@/api';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

const RELATIONSHIP_KEYS = ['mother', 'father', 'sister', 'brother', 'child', 'grandparent', 'other'] as const;

type Step = 'profile' | 'pin' | 'pinConfirm';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const { intendedRole, pendingEmail, savePin, setUser } = useAuth();
  const role = intendedRole ?? 'sender';

  const [step, setStep] = useState<Step>('profile');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  // Sender's first recipient (spec §6.1) / recipient's relationship to sender.
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [relationship, setRelationship] = useState<string>('mother');
  const [town, setTown] = useState('');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [saving, setSaving] = useState(false);

  const continueProfile = () => {
    if (!name.trim()) {
      setNameError(t('auth.nameRequired'));
      return;
    }
    setNameError(undefined);
    setStep('pin');
  };

  const finish = async (confirmedPin: string) => {
    if (confirmedPin !== firstPin) {
      setPinError(true);
      setPin('');
      return;
    }
    setSaving(true);
    try {
      const user = await api.createProfile({
        name: name.trim(),
        role,
        email: pendingEmail ?? '',
        language: i18n.language,
      });
      if (role === 'sender' && recipientName.trim()) {
        await api.createRecipient({
          name: recipientName.trim(),
          phone: recipientPhone.trim(),
          relationship,
          town: town.trim(),
          language: i18n.language,
        });
      }
      await savePin(confirmedPin);
      await setUser(user);
      track('onboarding_completed', { role });
      router.replace('/');
    } catch {
      toast.show(t('common.genericError'), 'error');
      setSaving(false);
      setStep('pin');
      setPin('');
      setFirstPin('');
    }
  };

  if (step !== 'profile') {
    const confirming = step === 'pinConfirm';
    return (
      <Screen>
        <ScreenHeader
          title={confirming ? t('auth.pinConfirmTitle') : t('auth.pinTitle')}
          subtitle={confirming ? undefined : t('auth.pinSubtitle')}
        />
        <View style={{ marginTop: spacing.xl, gap: spacing.xl }}>
          <PinInput
            key={step}
            value={pin}
            onChange={(v) => {
              setPin(v);
              setPinError(false);
            }}
            onComplete={(v) => {
              if (!confirming) {
                setFirstPin(v);
                setPin('');
                setStep('pinConfirm');
              } else {
                finish(v);
              }
            }}
            error={pinError}
            accessibilityLabel={t('auth.pinTitle')}
          />
          {pinError && (
            <Text variant="body" color="danger" align="center" accessibilityLiveRegion="assertive">
              {t('auth.pinMismatch')}
            </Text>
          )}
          {saving && (
            <Text variant="body" color="secondary" align="center">
              {t('common.loading')}
            </Text>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label={t('common.continue')} onPress={continueProfile} />}>
      <ScreenHeader title={t('auth.profileTitle')} back />
      <View style={{ gap: spacing.md }}>
        <TextField
          label={t('auth.nameLabel')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError(undefined);
          }}
          error={nameError}
          autoFocus
        />

        {role === 'sender' && (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <Text variant="h2">{t('auth.firstRecipientTitle')}</Text>
            <TextField
              label={t('auth.recipientNameLabel')}
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextField
              label={t('auth.recipientPhoneLabel')}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
            />
            <RelationshipPicker value={relationship} onChange={setRelationship} />
            <TextField label={t('auth.townLabel')} value={town} onChangeText={setTown} />
          </View>
        )}

        {role === 'recipient' && (
          <RelationshipPicker value={relationship} onChange={setRelationship} />
        )}
      </View>
    </Screen>
  );
}

export function RelationshipPicker({ value, onChange }: { value: string; onChange(v: string): void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.xxs }}>
      <Text variant="bodyStrong" color="secondary">
        {t('auth.relationshipLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {RELATIONSHIP_KEYS.map((key) => {
          const active = value === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={t(`auth.relationships.${key}`)}
              onPress={() => onChange(key)}
              style={{
                minHeight: touchTarget - 4,
                justifyContent: 'center',
                paddingHorizontal: spacing.md,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? colors.primaryTint : colors.surface,
              }}
            >
              <Text variant="bodyStrong" style={{ color: active ? colors.primaryDark : colors.textSecondary }}>
                {t(`auth.relationships.${key}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
