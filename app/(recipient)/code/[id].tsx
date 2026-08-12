import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { Button, Screen, Text } from '@/components';
import { buildPackageTemplates } from '@/api/mockData';
import { useRecipientOrders } from '@/hooks/useRecipientData';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Full-screen redeemable code (spec §6.3): the thing a vendor scans.
 * Served from cache with zero connectivity; brightness auto-boosts while
 * visible; a speaker icon reads the instructions aloud.
 */
export default function CodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { orders } = useRecipientOrders();
  const [speaking, setSpeaking] = useState(false);
  const previousBrightness = useRef<number | null>(null);

  const order = (orders ?? []).find((o) => o.id === id);
  const template = order ? buildPackageTemplates().find((tp) => tp.id === order.templateId) : undefined;

  // Boost brightness for the scan, restore on leave.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync();
        if (status !== 'granted' || !mounted) return;
        previousBrightness.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
      } catch {
        // Brightness is a nicety; the QR still works.
      }
    })();
    return () => {
      mounted = false;
      Speech.stop();
      if (previousBrightness.current != null) {
        Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
      }
    };
  }, []);

  const speak = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const text = `${t('recipient.codeTitle')}. ${t('recipient.codeHint')} ${order?.claimCode ?? ''}`;
    setSpeaking(true);
    Speech.speak(text, {
      language: i18n.language,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  if (!order) {
    return (
      <Screen scroll={false} offlineMessage={t('common.offlineCodeBanner')}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="h2" align="center">
            {t('recipient.emptyTitle')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      offlineMessage={t('common.offlineCodeBanner')}
      footer={<Button label={t('common.done')} onPress={() => router.back()} />}
    >
      <View style={{ alignItems: 'center', gap: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="h1" align="center" style={{ flex: 1 }}>
            {t('recipient.codeTitle')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('recipient.listen')}
            onPress={speak}
            style={{
              width: touchTarget + 8,
              height: touchTarget + 8,
              borderRadius: (touchTarget + 8) / 2,
              backgroundColor: speaking ? colors.primary : colors.primaryTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="volume-2" size={24} color={speaking ? colors.onPrimary : colors.primaryDark} />
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: spacing.xxl,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          accessibilityLabel={`QR ${order.claimCode}`}
        >
          <QRCode value={order.claimCode} size={220} backgroundColor="#FFFFFF" color="#241E1A" />
        </View>

        <Text
          variant="display"
          align="center"
          accessibilityLabel={order.claimCode.split('').join(' ')}
          style={{ letterSpacing: 4 }}
        >
          {order.claimCode}
        </Text>

        <Text variant="body" color="secondary" align="center" style={{ fontSize: 17 }}>
          {t('recipient.codeHint')}
        </Text>

        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Text variant="title">{t('recipient.contents')}</Text>
          {order.items.map((item) => (
            <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Feather name="check-circle" size={20} color={colors.accent} />
              <Text variant="body" style={{ fontSize: 18, flex: 1 }}>
                {item.label}
                {item.quantity > 1 ? `  ×${item.quantity}` : ''}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
