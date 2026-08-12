import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Screen, ScreenHeader, Text, TextField, toast } from '@/components';
import { api } from '@/lib/api';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

const RELATIONSHIP_KEYS = [
  'mother',
  'father',
  'sister',
  'brother',
  'grandmother',
  'child',
  'friend',
] as const;

/** Add-new-recipient, reachable from home and send step 1 (spec §6.2). */
export default function AddRecipient() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setRecipient = useSendFlow((s) => s.setRecipient);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<string>('mother');
  const [town, setTown] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = name.trim() && phone.trim() && town.trim();

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const recipient = await api.createRecipient({
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        town: town.trim(),
        language: i18n.language,
      });
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
      setRecipient(recipient);
      router.replace('/send/choose-package');
    } catch {
      toast(t('common.errorGeneric'), 'error');
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={<Button label={t('common.continue')} onPress={save} loading={saving} disabled={!valid} />}
    >
      <ScreenHeader title={t('send.addNewRecipient')} />
      <View style={{ gap: theme.spacing.md }}>
        <TextField label={t('profileSetup.recipientName')} value={name} onChangeText={setName} autoFocus />
        <TextField
          label={t('profileSetup.recipientPhone')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <View style={{ gap: 8 }}>
          <Text variant="bodyStrong" color="secondary">
            {t('profileSetup.relationship')}
          </Text>
          <View style={styles.chipRow}>
            {RELATIONSHIP_KEYS.map((key) => {
              const active = relationship === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t(`profileSetup.relationships.${key}`)}
                  onPress={() => setRelationship(key)}
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
                    style={{ color: active ? theme.colors.textOnPrimary : theme.colors.textPrimary }}
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
          value={town}
          onChangeText={setTown}
        />
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
