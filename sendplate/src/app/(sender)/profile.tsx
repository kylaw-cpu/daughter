import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, Screen, Text } from '@/components';
import { changeLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

export default function SenderProfile() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const recipientsQuery = useQuery({ queryKey: ['recipients'], queryFn: () => api.getRecipients() });

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <View style={styles.header}>
          <Avatar name={user?.name ?? ''} photoUrl={user?.photoUrl} size={64} />
          <View style={{ flex: 1 }}>
            <Text variant="h2">{user?.name}</Text>
            <Text variant="caption" color="muted">
              {user?.phone}
            </Text>
          </View>
        </View>

        <Card>
          <View style={{ gap: 10 }}>
            <Text variant="title">{t('common.language')}</Text>
            <View style={styles.langRow}>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const active = i18n.language === lang.code;
                return (
                  <Pressable
                    key={lang.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={lang.nativeName}
                    onPress={() => changeLanguage(lang.code)}
                    style={[
                      styles.langChip,
                      {
                        borderRadius: theme.radius.pill,
                        backgroundColor: active ? theme.colors.primary : theme.colors.bg,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="bodyStrong"
                      style={{ color: active ? theme.colors.textOnPrimary : theme.colors.textPrimary }}
                    >
                      {lang.nativeName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 4 }}>
            <Text variant="title">{t('profile.yourRecipients')}</Text>
            {(recipientsQuery.data ?? []).map((r) => (
              <View key={r.id} style={styles.recipientRow}>
                <Avatar name={r.name} size={36} />
                <Text variant="body" style={{ flex: 1 }}>
                  {r.name}
                </Text>
                <Text variant="caption" color="muted">
                  {r.town}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <Card onPress={() => router.push('/design')} accessibilityLabel={t('profile.designDemo')}>
          <View style={styles.linkRow}>
            <Feather name="grid" size={20} color={theme.colors.info} />
            <Text variant="body" style={{ flex: 1 }}>
              {t('profile.designDemo')}
            </Text>
            <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
          </View>
        </Card>

        <Button
          label={t('common.logOut')}
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  langChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 44,
    justifyContent: 'center',
  },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
