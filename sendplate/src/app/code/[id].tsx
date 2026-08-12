import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Brightness from 'expo-brightness';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import { Button, PackageGlyph, Screen, Skeleton, Text } from '@/components';
import { api } from '@/lib/api';
import { daysUntil } from '@/lib/dates';
import { cachedFetch } from '@/lib/storage';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Full-screen redeemable code (spec §6.3): large QR + big human-readable
 * code, contents in icons + words, brightness auto-boost, optional audio
 * instructions — and fully offline via the cached recipient orders.
 */
export default function CodeScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [speaking, setSpeaking] = useState(false);

  // Served from the same cache the home screen fills, so this works with
  // zero connectivity once the order has been seen once (spec §11).
  const ordersQuery = useQuery({
    queryKey: ['orders', 'recipient'],
    queryFn: () => cachedFetch('orders.recipient', () => api.getOrders('recipient')),
  });
  const order = (ordersQuery.data ?? []).find((o) => o.id === id);

  // Boost brightness while the code is on screen; restore on leave.
  useEffect(() => {
    let previous: number | undefined;
    (async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync();
        if (status === 'granted') {
          previous = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1);
        }
      } catch {
        // Brightness boost is best-effort.
      }
    })();
    return () => {
      if (previous !== undefined) {
        Brightness.setBrightnessAsync(previous).catch(() => {});
      }
      Speech.stop();
    };
  }, []);

  const speak = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(t('code.audioInstructions'), {
      language: i18n.language,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <Screen
      offlineMessage={t('common.offlineCodeBanner')}
      footer={<Button label={t('common.done')} onPress={() => router.back()} />}
    >
      <View style={styles.wrap}>
        <View style={styles.titleRow}>
          <Text variant="h2" align="center" style={{ flex: 1 }}>
            {t('code.title')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.listen')}
            accessibilityHint={t('code.audioInstructions')}
            onPress={speak}
            style={[
              styles.speaker,
              {
                backgroundColor: speaking ? theme.colors.primary : theme.colors.primaryTint,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <Feather
              name="volume-2"
              size={22}
              color={speaking ? theme.colors.textOnPrimary : theme.colors.primary}
            />
          </Pressable>
        </View>

        {!order ? (
          ordersQuery.isLoading ? (
            <Skeleton width={240} height={240} radius={theme.radius.lg} />
          ) : (
            <Text variant="body" color="secondary" align="center">
              {t('common.errorGeneric')}
            </Text>
          )
        ) : (
          <>
            <View
              style={[
                styles.qrCard,
                { backgroundColor: '#FFFFFF', borderRadius: theme.radius.lg },
                theme.shadow,
              ]}
              accessibilityLabel={`${t('code.title')}. ${order.claimCode}`}
            >
              <QRCode value={order.claimCode} size={230} backgroundColor="#FFFFFF" color="#241E1A" />
            </View>

            <Text
              variant="display"
              align="center"
              accessibilityLabel={order.claimCode.split('').join(' ')}
              style={styles.codeText}
            >
              {order.claimCode}
            </Text>

            <View style={styles.contentsRow}>
              <PackageGlyph glyph={order.glyph} size={40} />
              <View style={{ flexShrink: 1 }}>
                <Text variant="bodyStrong">{order.templateName}</Text>
                <Text variant="caption" color="secondary">
                  {order.items.map((i) => i.label).join(' · ')}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Feather name="wifi-off" size={14} color={theme.colors.textMuted} />
              <Text variant="caption" color="muted">
                {t('code.worksOffline')} · {t('code.expiresIn', { days: daysUntil(order.expiresAt) })}
              </Text>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 20, paddingTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  speaker: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  qrCard: { padding: 20 },
  codeText: { letterSpacing: 2 },
  contentsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
