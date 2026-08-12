import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useVendorQueue } from '@/store/vendorQueueStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Vendor: two screens, dead-simple, one-handed (spec §6.4). */
export default function VendorLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const pendingCount = useVendorQueue((s) => s.items.filter((i) => i.status === 'pending').length);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 13 },
        sceneStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Tabs.Screen
        name="redeem"
        options={{
          title: t('vendor.redeemTitle'),
          tabBarIcon: ({ color }) => <Feather name="maximize" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('vendor.historyTitle'),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarIcon: ({ color }) => <Feather name="list" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
