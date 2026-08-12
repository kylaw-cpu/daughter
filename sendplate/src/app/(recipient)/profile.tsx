import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, Screen, Text } from '@/components';
import { changeLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

const SUPPORT_PHONE = 'tel:+254800724444'; // support line (mock)

/** Recipient profile (spec §6.3): language, senders, PIN, and a big help line. */
export default function RecipientProfile() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <View style={styles.header}>
          <Avatar name={user?.name ?? ''} size={64} />
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
          <View style={styles.linkRow}>
            <Feather name="users" size={20} color={theme.colors.accent} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{t('profile.linkedSenders')}</Text>
              <Text variant="caption" color="secondary">
                Amina · +1 555 010 0001
              </Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.linkRow}>
            <Feather name="lock" size={20} color={theme.colors.info} />
            <Text variant="body" style={{ flex: 1 }}>
              {t('profile.security')}
            </Text>
            <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
          </View>
        </Card>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.callForHelp')}
          onPress={() => Linking.openURL(SUPPORT_PHONE).catch(() => {})}
          style={[
            styles.helpButton,
            { backgroundColor: theme.colors.accent, borderRadius: theme.radius.lg },
          ]}
        >
          <Feather name="phone-call" size={28} color={theme.colors.textOnPrimary} />
          <Text variant="h2" color="onPrimary">
            {t('common.callForHelp')}
          </Text>
        </Pressable>

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
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  helpButton: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
});
