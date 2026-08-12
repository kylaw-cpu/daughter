import React, { useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, ScreenHeader, Text } from '@/components';
import { keys, usePayOrder } from '@/hooks/queries';
import { getPaymentProvider } from '@/payments/PaymentProvider';
import { formatMoney } from '@/lib/money';
import { track } from '@/analytics/analytics';
import { useAuth } from '@/store/auth';
import { useSendFlow } from '@/store/sendFlow';
import type { Order } from '@/api/types';
import { radius, spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useReducedMotion } from '@/lib/useReducedMotion';

type PayState = 'idle' | 'processing' | 'success' | 'failure' | 'pending';

/**
 * Send flow step 5. The demo payment methods exercise every state the spec
 * requires (§6.2): success, decline (retry keeps the order), and async-pending.
 * Real Stripe PaymentSheet slots in behind PaymentProvider in Phase 4.
 */
const METHODS = [
  { id: 'saved_visa', simulate: 'succeed', icon: 'credit-card', label: 'Visa •••• 4242' },
  { id: 'test_declined', simulate: 'fail', icon: 'x-octagon', label: 'Test: declined card' },
  { id: 'test_pending', simulate: 'pending', icon: 'clock', label: 'Test: mobile money (async)' },
] as const;

export default function PayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const reducedMotion = useReducedMotion();
  const user = useAuth((s) => s.user);
  const { recipient, draftOrder, reset } = useSendFlow();
  const payOrder = usePayOrder();

  const [state, setState] = useState<PayState>('idle');
  const [method, setMethod] = useState<(typeof METHODS)[number]>(METHODS[0]);
  // One idempotency key per order: retries can never double-charge (spec §13).
  const idemKey = useRef(`pay-${draftOrder?.id ?? 'none'}`).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  if (!draftOrder || !recipient) return <Redirect href="/(sender)/send/choose-recipient" />;

  const currency = user?.currency ?? 'USD';
  const total = draftOrder.amountSenderCurrency;

  const pay = async () => {
    setState('processing');
    try {
      const result = await getPaymentProvider(method.simulate).collectPayment({
        amountMinorUnits: total,
        currency,
        orderId: draftOrder.id,
      });
      if (result.status === 'failed') {
        track('payment_failed', { reason: result.errorMessage ?? 'declined' });
        setState('failure');
        return;
      }
      if (result.status === 'pending') {
        setState('pending');
        return;
      }
      await payOrder.mutateAsync({
        orderId: draftOrder.id,
        paymentMethodId: result.paymentMethodId,
        idemKey,
      });
      track('payment_succeeded', { orderId: draftOrder.id });
      // Repeat-send within 30 days is the north-star metric (spec §14).
      const prior = qc.getQueryData<Order[]>(keys.orders('sender'));
      if (prior && prior.length > 0) track('repeat_send', { count: prior.length + 1 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setState('success');
      if (!reducedMotion) {
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 6, bounciness: 10 }).start();
      } else {
        checkScale.setValue(1);
      }
    } catch {
      track('payment_failed', { reason: 'api' });
      setState('failure');
    }
  };

  const finishToActivity = () => {
    qc.invalidateQueries({ queryKey: keys.orders('sender') });
    reset();
    router.dismissAll();
    router.replace('/(sender)/activity');
  };

  if (state === 'success') {
    // Celebratory but calm (spec §6.2) — gentle check draw-in, no confetti.
    return (
      <Screen scroll={false} footer={<Button label={t('common.done')} onPress={finishToActivity} />}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
          <Animated.View
            style={{
              transform: [{ scale: checkScale }],
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: colors.accentTint,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="check" size={56} color={colors.accent} />
          </Animated.View>
          <View style={{ gap: spacing.xs, alignItems: 'center' }}>
            <Text variant="display" align="center">
              {t('sender.paySuccessTitle')}
            </Text>
            <Text variant="body" color="secondary" align="center">
              {t('sender.paySuccessBody', { name: recipient.name })}
            </Text>
          </View>
          <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: colors.primaryTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" color="brand">
                    {step}
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={{ flex: 1 }}>
                  {t(`sender.nextSteps${step}`, { name: recipient.name })}
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
          label={
            state === 'processing'
              ? t('sender.paying')
              : t('sender.payCta', { amount: formatMoney(total, currency) })
          }
          onPress={pay}
          loading={state === 'processing'}
        />
      }
    >
      <ScreenHeader title={t('sender.payCta', { amount: formatMoney(total, currency) })} back />

      {state === 'failure' && (
        <Card style={{ borderColor: colors.danger, borderWidth: 1.5, marginBottom: spacing.md }}>
          <Text variant="title" color="danger">
            {t('sender.payFailTitle')}
          </Text>
          <Text variant="body" color="secondary">
            {t('sender.payFailBody')}
          </Text>
        </Card>
      )}
      {state === 'pending' && (
        <Card style={{ borderColor: colors.warning, borderWidth: 1.5, marginBottom: spacing.md }}>
          <Text variant="title">{t('sender.payPendingTitle')}</Text>
          <Text variant="body" color="secondary">
            {t('sender.payPendingBody')}
          </Text>
        </Card>
      )}

      <View style={{ gap: spacing.sm }}>
        {METHODS.map((m) => {
          const active = method.id === m.id;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={m.label}
              onPress={() => setMethod(m)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 2,
                borderColor: active ? colors.primary : colors.border,
                padding: spacing.md,
                minHeight: 60,
              }}
            >
              <Feather name={m.icon} size={22} color={active ? colors.primary : colors.textMuted} />
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {m.label}
              </Text>
              {active && <Feather name="check-circle" size={20} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
