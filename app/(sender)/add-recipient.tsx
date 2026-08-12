import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Screen, ScreenHeader, TextField, useToast } from '@/components';
import { useCreateRecipient } from '@/hooks/queries';
import { spacing } from '@/theme/theme';
import { RelationshipPicker } from '../(auth)/profile-setup';

export default function AddRecipientScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const create = useCreateRecipient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('mother');
  const [town, setTown] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();

  const submit = async () => {
    if (!name.trim()) {
      setNameError(t('auth.nameRequired'));
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        town: town.trim(),
        language: i18n.language,
      });
      router.back();
    } catch {
      toast.show(t('common.genericError'), 'error');
    }
  };

  return (
    <Screen footer={<Button label={t('common.save')} onPress={submit} loading={create.isPending} />}>
      <ScreenHeader title={t('sender.addRecipient')} back />
      <View style={{ gap: spacing.md }}>
        <TextField
          label={t('auth.recipientNameLabel')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError(undefined);
          }}
          error={nameError}
          autoFocus
        />
        <TextField
          label={t('auth.recipientPhoneLabel')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <RelationshipPicker value={relationship} onChange={setRelationship} />
        <TextField label={t('auth.townLabel')} value={town} onChangeText={setTown} />
      </View>
    </Screen>
  );
}
