import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Card, Screen, Text } from '@/components';
import { SUPPORTED_LANGUAGES, setLanguage } from '@/i18n';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Role } from '@/api/types';

/** Warm plate/hands hero motif, drawn in-app so it costs no download size. */
function Hero() {
  const { colors } = useTheme();
  return (
    <Svg width={160} height={120} viewBox="0 0 160 120" accessibilityLabel="">
      <Ellipse cx="80" cy="66" rx="52" ry="30" fill={colors.primaryTint} />
      <Ellipse cx="80" cy="62" rx="40" ry="22" fill={colors.surface} stroke={colors.primary} strokeWidth={3} />
      <Circle cx="68" cy="58" r="7" fill={colors.primary} opacity={0.85} />
      <Circle cx="88" cy="54" r="6" fill={colors.accent} opacity={0.85} />
      <Circle cx="92" cy="66" r="5" fill={colors.warning} opacity={0.85} />
      <Path d="M20 96c14-10 30-14 60-14s46 4 60 14" stroke={colors.accent} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const setIntendedRole = useAuth((s) => s.setIntendedRole);

  const choose = (role: Role) => {
    setIntendedRole(role);
    track('onboarding_started', { role });
    router.push('/(auth)/phone-entry');
  };

  return (
    <Screen>
      <View style={{ alignItems: 'flex-end' }}>
        {/* Language selector: each language shown in its own script */}
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('welcome.chooseLanguage')}
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 3,
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <Pressable
                key={lang.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={lang.label}
                onPress={() => setLanguage(lang.code)}
                style={{
                  paddingHorizontal: spacing.md,
                  minHeight: touchTarget - 8,
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  backgroundColor: active ? colors.primary : 'transparent',
                }}
              >
                <Text variant="bodyStrong" style={{ color: active ? colors.onPrimary : colors.textSecondary }}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: spacing.sm, marginVertical: spacing.huge }}>
        <Hero />
        <Text variant="display" align="center">
          {t('common.appName')}
        </Text>
        <Text variant="body" color="secondary" align="center">
          {t('common.tagline')}
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        <Card onPress={() => choose('sender')} accessibilityLabel={t('welcome.sendingRole')}>
          <RoleRow
            icon="send"
            title={t('welcome.sendingRole')}
            hint={t('welcome.sendingRoleHint')}
          />
        </Card>
        <Card onPress={() => choose('recipient')} accessibilityLabel={t('welcome.receivingRole')}>
          <RoleRow
            icon="gift"
            title={t('welcome.receivingRole')}
            hint={t('welcome.receivingRoleHint')}
          />
        </Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('welcome.vendorLink')}
          onPress={() => choose('vendor')}
          style={{ alignSelf: 'center', minHeight: touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md }}
        >
          <Text variant="bodyStrong" color="brand">
            {t('welcome.vendorLink')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function RoleRow({ icon, title, hint }: { icon: 'send' | 'gift'; title: string; hint: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: radius.md,
          backgroundColor: colors.primaryTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name={icon} size={26} color={colors.primaryDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="h2">{title}</Text>
        <Text variant="body" color="secondary">
          {hint}
        </Text>
      </View>
      <Feather name="chevron-right" size={22} color={colors.textMuted} />
    </View>
  );
}
