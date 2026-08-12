import React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { resetMockDb } from '@/api/mockApi';
import { SUPPORTED_LANGUAGES, setLanguage } from '@/i18n';
import { useAuth } from '@/store/auth';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

/**
 * Shared profile body for all three roles: identity, language, PIN, help,
 * plus demo utilities (design-system screen, reset mock data, sign out).
 */
export function ProfileContent({ showCallForHelp = false }: { showCallForHelp?: boolean }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { user, signOut } = useAuth();
  const setUser = useAuth((s) => s.setUser);

  const switchLanguage = async (code: (typeof SUPPORTED_LANGUAGES)[number]['code']) => {
    await setLanguage(code);
    if (user) {
      try {
        await setUser(await api.patchMe({ language: code }));
      } catch {
        // Local change already applied; server sync retries next session.
      }
    }
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={user?.name ?? '·'} photoUrl={user?.photoUrl} size={60} />
          <View style={{ flex: 1 }}>
            <Text variant="h2">{user?.name ?? ''}</Text>
            <Text variant="body" color="secondary">
              {user?.phone ?? ''}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text variant="bodyStrong" color="secondary" style={{ marginBottom: spacing.xs }}>
          {t('recipient.language')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <Pressable
                key={lang.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={lang.label}
                onPress={() => switchLanguage(lang.code)}
                style={{
                  minHeight: touchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  borderRadius: radius.pill,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryTint : colors.surface,
                }}
              >
                <Text variant="bodyStrong" style={{ color: active ? colors.primaryDark : colors.textSecondary }}>
                  {lang.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {showCallForHelp && (
        <Button
          label={t('recipient.callHelp')}
          icon={<Feather name="phone-call" size={20} color={colors.onPrimary} />}
          onPress={() => Linking.openURL('tel:+254800724724').catch(() => {})}
        />
      )}

      <Card onPress={() => router.push('/design-system')} accessibilityLabel={t('ds.title')}>
        <Row icon="grid" label={t('ds.title')} />
      </Card>

      <Card
        onPress={async () => {
          await resetMockDb();
          await signOut();
          qc.clear();
          router.replace('/(auth)/welcome');
        }}
        accessibilityLabel="Sign out"
      >
        <Row icon="log-out" label="Sign out (reset demo)" danger />
      </Card>
    </View>
  );
}

function Row({ icon, label, danger = false }: { icon: keyof typeof Feather.glyphMap; label: string; danger?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Feather name={icon} size={20} color={danger ? colors.danger : colors.textSecondary} />
      <Text variant="bodyStrong" color={danger ? 'danger' : 'primary'} style={{ flex: 1 }}>
        {label}
      </Text>
      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </View>
  );
}
