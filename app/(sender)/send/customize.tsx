import React from 'react';
import { Pressable, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Card, Screen, ScreenHeader, Text, TextField } from '@/components';
import { FX_RATE } from '@/api/mockData';
import { coverageWeeks, priceItems, toSenderAmount } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';
import { useAuth } from '@/store/auth';
import { useSendFlow } from '@/store/sendFlow';
import { radius, spacing, touchTarget } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Send flow step 3: quantities, add-ons, live price + plain-language coverage. */
export default function CustomizeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuth((s) => s.user);
  const { template, quantities, message, setQuantity, setMessage, selectedItems } = useSendFlow();

  if (!template) return <Redirect href="/(sender)/send/choose-package" />;

  const items = selectedItems();
  const localAmount = priceItems(items, template);
  const { total } = toSenderAmount(localAmount, FX_RATE);
  const weeks = coverageWeeks(items, template);
  const currency = user?.currency ?? 'USD';

  return (
    <Screen
      footer={
        <View style={{ gap: spacing.xs }}>
          <Text variant="body" color="accent" align="center" accessibilityLiveRegion="polite">
            {weeks <= 1 ? t('sender.coverageOne') : t('sender.coverage', { weeks })}
          </Text>
          <Button
            label={t('common.continue')}
            onPress={() => router.push('/(sender)/send/review')}
            disabled={items.length === 0}
          />
        </View>
      }
    >
      <ScreenHeader title={t('sender.customizeTitle')} subtitle={template.name} back />
      <View style={{ gap: spacing.md }}>
        <Card>
          <View style={{ gap: spacing.sm }}>
            {template.baseItems.map((item) => (
              <QuantityRow
                key={item.key}
                label={item.label}
                quantity={quantities[item.key] ?? 0}
                onChange={(q) => setQuantity(item.key, q)}
              />
            ))}
          </View>
        </Card>

        {template.addOns.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <Text variant="title">{t('sender.addOns')}</Text>
            <Card>
              <View style={{ gap: spacing.sm }}>
                {template.addOns.map((addOn) => {
                  const active = (quantities[addOn.key] ?? 0) > 0;
                  return (
                    <Pressable
                      key={addOn.key}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={addOn.label}
                      onPress={() => setQuantity(addOn.key, active ? 0 : 1)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        minHeight: touchTarget,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: radius.sm - 2,
                          borderWidth: 2,
                          borderColor: active ? colors.accent : colors.border,
                          backgroundColor: active ? colors.accent : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {active && <Feather name="check" size={16} color={colors.onPrimary} />}
                      </View>
                      <Text variant="body" style={{ flex: 1 }}>
                        + {addOn.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        <TextField
          label={t('sender.messageLabel')}
          placeholder={t('sender.messagePlaceholder')}
          value={message}
          onChangeText={setMessage}
          multiline
          style={{ minHeight: 72, paddingTop: spacing.sm }}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.primaryTint,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Text variant="bodyStrong">{t('sender.total')}</Text>
          <Text variant="h2" accessibilityLiveRegion="polite">
            {formatMoney(total, currency)}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function QuantityRow({
  label,
  quantity,
  onChange,
}: {
  label: string;
  quantity: number;
  onChange(q: number): void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Stepper
          icon="minus"
          label={`${t('sender.quantity')} -`}
          disabled={quantity <= 0}
          onPress={() => onChange(quantity - 1)}
        />
        <Text variant="title" style={{ minWidth: 28, textAlign: 'center' }}>
          {quantity}
        </Text>
        <Stepper
          icon="plus"
          label={`${t('sender.quantity')} +`}
          disabled={quantity >= 9}
          onPress={() => onChange(quantity + 1)}
        />
      </View>
    </View>
  );
}

function Stepper({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'plus' | 'minus';
  label: string;
  disabled?: boolean;
  onPress(): void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: touchTarget,
        height: touchTarget,
        borderRadius: radius.pill,
        backgroundColor: pressed ? colors.primaryTint : colors.surface,
        borderWidth: 1.5,
        borderColor: disabled ? colors.border : colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Feather name={icon} size={20} color={disabled ? colors.textMuted : colors.primary} />
    </Pressable>
  );
}
