import React, { useState } from 'react';
import { View } from 'react-native';
import {
  Avatar,
  BigActionButton,
  BottomSheet,
  Button,
  Card,
  EmptyState,
  OtpInput,
  PackageCard,
  PinInput,
  ProofPhoto,
  Screen,
  ScreenHeader,
  Skeleton,
  SkeletonCard,
  StatusChip,
  Text,
  TextField,
  toast,
} from '@/components';
import { OrderStatus, PackageTemplate } from '@/models/types';
import { useTheme } from '@/theme/ThemeProvider';

const sampleTemplate: PackageTemplate = {
  id: 'tpl_kids_protein',
  key: 'kids_protein',
  name: 'Growing Kids Protein Box',
  description: 'Protein and iron for growing children — eggs, lentils and fortified porridge.',
  coverage: '~2 weeks for 2 children',
  glyph: 'kids_protein',
  category: 'food',
  baseItems: [],
  addOns: [],
  basePriceLocal: 115000,
  popular: true,
};

/**
 * Storybook-style demo of the shared component library (spec §12 Phase 0).
 * Reachable from the profile screen — useful for design review and RTL /
 * dark-mode / font-scaling checks.
 */
export default function DesignDemo() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const gap = { gap: theme.spacing.md } as const;
  const statuses: OrderStatus[] = ['paid', 'ready', 'collected', 'expired'];

  return (
    <Screen>
      <ScreenHeader title="Design system" />
      <View style={gap}>
        <Text variant="h2">Typography</Text>
        <Text variant="display">Display 32</Text>
        <Text variant="h1">Heading 1 — 26</Text>
        <Text variant="h2">Heading 2 — 21</Text>
        <Text variant="title">Title — 18</Text>
        <Text variant="body">Body — 16. Warm, trustworthy, dignified, calm.</Text>
        <Text variant="bodyStrong">Body strong — 16 medium</Text>
        <Text variant="caption" color="secondary">
          Caption — 13, secondary color
        </Text>

        <Text variant="h2">Buttons</Text>
        <Button label="Primary" onPress={() => toast('Primary tapped', 'success')} />
        <Button label="Secondary" variant="secondary" onPress={() => {}} />
        <Button label="Ghost" variant="ghost" onPress={() => {}} />
        <Button label="Danger" variant="danger" onPress={() => {}} />
        <Button label="Loading" loading onPress={() => {}} />
        <Button label="Disabled" disabled onPress={() => {}} />

        <Text variant="h2">Status chips</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {statuses.map((s) => (
            <StatusChip key={s} status={s} label={s} />
          ))}
        </View>

        <Text variant="h2">Package card</Text>
        <PackageCard
          template={sampleTemplate}
          senderCurrency="USD"
          localCurrency="KES"
          fxRate={129.35}
          onPress={() => toast('Package selected')}
        />

        <Text variant="h2">Avatars</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Avatar name="Mama Achieng" />
          <Avatar name="Otieno K" />
          <Avatar name="Amina" size={56} />
        </View>

        <Text variant="h2">Text field</Text>
        <TextField
          label="Their name"
          placeholder="e.g. Amina"
          value={text}
          onChangeText={setText}
          helperText="Helper text goes here"
        />
        <TextField label="With error" value="oops" onChangeText={() => {}} errorText="That doesn't look right" />

        <Text variant="h2">PIN / OTP</Text>
        <PinInput value={pin} onChange={setPin} autoFocus={false} accessibilityLabel="PIN demo" />
        <OtpInput value={otp} onChange={setOtp} autoFocus={false} accessibilityLabel="OTP demo" />

        <Text variant="h2">Cards & proof photo</Text>
        <Card>
          <Text variant="title">A quiet card</Text>
          <Text color="secondary">With soft, warm elevation.</Text>
        </Card>
        <ProofPhoto photoUrl="mock://proof/basket" />

        <Text variant="h2">Skeletons</Text>
        <SkeletonCard />
        <Skeleton width="60%" height={14} />

        <Text variant="h2">Big action button</Text>
        <BigActionButton label="Show my code" icon="grid" onPress={() => toast('Code!')} />

        <Text variant="h2">Sheet & empty state</Text>
        <Button label="Open bottom sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
        <EmptyState
          title="Nothing to collect right now"
          body="When someone sends you food or care, it will appear here."
          actionLabel="Do a thing"
          onAction={() => toast('Action!')}
        />
      </View>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <Text variant="title">A gentle sheet</Text>
        <Text color="secondary">Used for payment and confirmations.</Text>
        <Button label="Done" onPress={() => setSheetOpen(false)} />
      </BottomSheet>
    </Screen>
  );
}
