import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Card,
  CardListSkeleton,
  EmptyState,
  OtpInput,
  PackageCard,
  PinInput,
  Screen,
  ScreenHeader,
  StatusChip,
  Text,
  TextField,
  useToast,
} from '@/components';
import { buildPackageTemplates, FX_RATE, LOCAL_CURRENCY, SENDER_CURRENCY } from '@/api/mockData';
import { spacing } from '@/theme/theme';

/**
 * Storybook-style demo of the shared component library (spec Phase 0):
 * every core component, in every notable state, on one scrollable screen.
 */
export default function DesignSystemScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const [otp, setOtp] = useState('12');
  const [pin, setPin] = useState('');
  const template = buildPackageTemplates()[0]!;

  return (
    <Screen>
      <ScreenHeader title={t('ds.title')} back />
      <View style={{ gap: spacing.xxl }}>
        <Section label="Text">
          <Text variant="display">Display 32</Text>
          <Text variant="h1">Heading 1 — 26</Text>
          <Text variant="h2">Heading 2 — 21</Text>
          <Text variant="title">Title — 18</Text>
          <Text variant="body">Body 16 — warm, trustworthy, dignified, calm.</Text>
          <Text variant="bodyStrong">Body strong 16</Text>
          <Text variant="caption" color="muted">
            Caption 13 · muted
          </Text>
        </Section>

        <Section label="Buttons">
          <Button label="Primary" onPress={() => toast.show('Primary tapped', 'success')} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Danger" variant="danger" onPress={() => {}} />
          <Button label="Loading" loading />
          <Button label="Disabled" disabled />
        </Section>

        <Section label="PackageCard (signature)">
          <PackageCard
            template={template}
            priceSender={Math.round(template.basePriceLocal / FX_RATE)}
            senderCurrency={SENDER_CURRENCY}
            localCurrency={LOCAL_CURRENCY}
            selected
            onPress={() => {}}
          />
        </Section>

        <Section label="Status chips">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            <StatusChip status="paid" />
            <StatusChip status="ready" />
            <StatusChip status="collected" />
            <StatusChip status="expired" />
          </View>
        </Section>

        <Section label="Avatar">
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Avatar name="Amina Otieno" />
            <Avatar name="Mama Grace" />
            <Avatar name="K" size={40} />
          </View>
        </Section>

        <Section label="TextField">
          <TextField label="Name" placeholder="Amina" helper="As it appears on ID" />
          <TextField label="Phone" placeholder="+254…" error="That number doesn't look right" />
        </Section>

        <Section label="OTP / PIN inputs">
          <OtpInput value={otp} onChange={setOtp} autoFocus={false} />
          <PinInput value={pin} onChange={setPin} autoFocus={false} />
        </Section>

        <Section label="Card">
          <Card onPress={() => toast.show('Card pressed')}>
            <Text variant="title">Pressable card</Text>
            <Text variant="body" color="secondary">
              lg radius, soft warm shadow, hairline border in dark mode.
            </Text>
          </Card>
        </Section>

        <Section label="Skeletons">
          <CardListSkeleton count={2} />
        </Section>

        <Section label="Empty state">
          <EmptyState
            icon="inbox"
            title="Nothing here yet"
            body="One sentence, one clear action, never a dead end."
            ctaLabel="Do the thing"
            onCta={() => toast.show('CTA!', 'info')}
          />
        </Section>
      </View>
    </Screen>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
