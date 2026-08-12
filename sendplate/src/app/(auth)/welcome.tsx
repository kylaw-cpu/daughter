import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path } from 'react-native-svg';
import { Card, Screen, Text } from '@/components';
import { changeLanguage, SUPPORTED_LANGUAGES } from '@/i18n';
import { Role } from '@/models/types';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Welcome (spec §6.1): set language and role in the first 10 seconds.
 * Language choice applies immediately and re-renders the whole app.
 */
export default function Welcome() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const setIntendedRole = useAuthStore((s) => s.setIntendedRole);

  const chooseRole = (role: Role) => {
    setIntendedRole(role);
    router.push('/(auth)/phone-entry');
  };

  return (
    <Screen offlineBanner={false}>
      <View style={styles.hero}>
        {/* Warm plate/hands hero motif, drawn inline to keep the app small. */}
        <Svg width={160} height={120} viewBox="0 0 160 120">
          <Path d="M12 112 q24 -24 58 -18" stroke={theme.colors.accent} strokeWidth={8} strokeLinecap="round" fill="none" />
          <Path d="M148 112 q-24 -24 -58 -18" stroke={theme.colors.accent} strokeWidth={8} strokeLinecap="round" fill="none" />
          <Circle cx="80" cy="56" r="40" fill={theme.colors.primaryTint} />
          <Circle cx="80" cy="56" r="25" fill={theme.colors.primary} />
          <Circle cx="80" cy="56" r="9" fill={theme.colors.primaryTint} />
        </Svg>
        <Text variant="display" align="center">
          {t('welcome.title')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.langBlock}>
        <Text variant="bodyStrong" color="secondary">
          {t('welcome.chooseLanguage')}
        </Text>
        <View style={styles.langRow}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <Pressable
                key={lang.code}
                accessibilityRole="button"
                accessibilityLabel={lang.nativeName}
                accessibilityState={{ selected: active }}
                onPress={() => changeLanguage(lang.code)}
                style={[
                  styles.langChip,
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
                  {lang.nativeName}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <Card
          onPress={() => chooseRole('sender')}
          accessibilityLabel={t('welcome.iAmSending')}
          accessibilityHint={t('welcome.iAmSendingHint')}
        >
          <View style={styles.roleRow}>
            <View style={[styles.roleIcon, { backgroundColor: theme.colors.primaryTint }]}>
              <Feather name="send" size={26} color={theme.colors.primary} />
            </View>
            <View style={styles.roleText}>
              <Text variant="title">{t('welcome.iAmSending')}</Text>
              <Text variant="body" color="secondary">
                {t('welcome.iAmSendingHint')}
              </Text>
            </View>
          </View>
        </Card>
        <Card
          onPress={() => chooseRole('recipient')}
          accessibilityLabel={t('welcome.iAmReceiving')}
          accessibilityHint={t('welcome.iAmReceivingHint')}
        >
          <View style={styles.roleRow}>
            <View style={[styles.roleIcon, { backgroundColor: theme.colors.accentTint }]}>
              <Feather name="gift" size={26} color={theme.colors.accent} />
            </View>
            <View style={styles.roleText}>
              <Text variant="title">{t('welcome.iAmReceiving')}</Text>
              <Text variant="body" color="secondary">
                {t('welcome.iAmReceivingHint')}
              </Text>
            </View>
          </View>
        </Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.iAmVendor')}
          onPress={() => chooseRole('vendor')}
          style={styles.vendorLink}
          hitSlop={8}
        >
          <Text variant="bodyStrong" color="brand">
            {t('welcome.iAmVendor')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingTop: 32, paddingBottom: 8 },
  langBlock: { gap: 10, marginTop: 24 },
  langRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  langChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1.5,
    minHeight: 48,
    justifyContent: 'center',
  },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  roleIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleText: { flex: 1, gap: 2 },
  vendorLink: { alignSelf: 'center', padding: 12, minHeight: 44, justifyContent: 'center' },
});
