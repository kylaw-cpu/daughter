import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, ScreenHeader, Text } from '@/components';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import { paymentProvider } from '@/lib/payments';
import { useSendFlow } from '@/store/sendFlowStore';
import { useTheme } from '@/theme/ThemeProvider';

type PayState = 'idle' | 'processing' | 'failed' | 'success';

/**
 * Send step 5 (spec §6.2): payment via the PaymentProvider interface.
 * Failure keeps the draft order so retry never loses it; success is a calm
 * celebration with "what happens next" in 3 steps.
 */
export default function Pay() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { draftOrder, recipient, reset } = useSendFlow();
  const [state, setState] = useState<PayState>('idle');
  // One idempotency key per order attempt-session prevents double charges
  // even if the user taps twice (spec §13).
  const idemKey = useRef(`pay_${Math.random().toString(36).slice(2, 12)}`);

  if (!draftOrder || !recipient) return <Redirect href="/send/choose-recipient" />;

  const amount = formatMoney(draftOrder.amountSenderCurrency, draftOrder.senderCurrency);

  const pay = async () => {
    setState('processing');
    try {
      const result = await paymentProvider.presentPaymentSheet({
        amountMinor: draftOrder.amountSenderCurrency,
        currency: draftOrder.senderCurrency,
        orderId: draftOrder.id,
      });
      if (result.status !== 'succeeded') {
        setState('failed');
        return;
      }
      await api.payOrder(draftOrder.id, result.paymentMethodId, idemKey.current);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState('success');
    } catch {
      setState('failed');
    }
  };

  if (state === 'success') {
    const steps = [
      t('send.successStep1', { name: recipient.name }),
      t('send.successStep2'),
      t('send.successStep3'),
    ];
    return (
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            <Button
              label={t('send.viewActivity')}
              onPress={() => {
                reset();
                router.dismissAll();
                router.replace('/(sender)/activity');
              }}
            />
            <Button
              label={t('send.backHome')}
              variant="ghost"
              onPress={() => {
                reset();
                router.dismissAll();
                router.replace('/(sender)/home');
              }}
            />
          </View>
        }
      >
        <View style={styles.successWrap}>
          <View style={[styles.successCircle, { backgroundColor: theme.colors.accentTint }]}>
            <Feather name="check" size={48} color={theme.colors.accent} />
          </View>
          <Text variant="display" align="center">
            {t('send.successTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center">
            {t('send.successBody', { name: recipient.name })}
          </Text>
          <View style={{ gap: 12, alignSelf: 'stretch', marginTop: 16 }}>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: theme.colors.primaryTint }]}>
                  <Text variant="bodyStrong" color="brand">
                    {i + 1}
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={{ flex: 1 }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label={state === 'processing' ? t('send.processing') : t('send.payNow', { amount })}
          onPress={pay}
          loading={state === 'processing'}
        />
      }
    >
      <ScreenHeader title={t('send.payTitle')} />
      <View style={{ gap: theme.spacing.md }}>
        <Card>
          <View style={styles.summaryRow}>
            <Text variant="body" color="secondary" style={{ flex: 1 }}>
              {draftOrder.templateName}
            </Text>
            <Text variant="h2" color="brand">
              {amount}
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            {t('send.theyReceive', {
              name: recipient.name,
              amount: formatMoney(draftOrder.amountLocalCurrency, draftOrder.localCurrency),
            })}
          </Text>
        </Card>

        <Card>
          <View style={styles.methodRow}>
            <Feather name="credit-card" size={22} color={theme.colors.info} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Visa •••• 4242</Text>
              <Text variant="caption" color="muted">
                {paymentProvider.name === 'mock' ? 'Test mode' : paymentProvider.name}
              </Text>
            </View>
            <Feather name="check-circle" size={20} color={theme.colors.accent} />
          </View>
        </Card>

        {state === 'failed' ? (
          <View
            accessibilityLiveRegion="assertive"
            style={[styles.errorBox, { backgroundColor: theme.colors.dangerTint, borderRadius: theme.radius.md }]}
          >
            <Feather name="alert-circle" size={20} color={theme.colors.danger} />
            <Text variant="body" style={{ color: theme.colors.danger, flex: 1 }}>
              {t('send.paymentFailed')}
            </Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  successWrap: { alignItems: 'center', gap: 12, paddingTop: 48 },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
});
