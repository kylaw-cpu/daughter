import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { typeScale } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { useOnline } from '@/store/network';
import { useOfflineQueue, usePendingSyncCount } from '@/store/offlineQueue';
import { useToast } from '@/components';
import { Text } from '@/components';

/** Vendor: 2 screens, dead-simple, one-handed (spec §6.4). */
export default function VendorLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const online = useOnline();
  const pending = usePendingSyncCount();
  const toast = useToast();

  // Auto-sync queued redemptions whenever connectivity returns (spec §11).
  useEffect(() => {
    if (online && pending > 0) {
      useOfflineQueue
        .getState()
        .sync()
        .then((n) => {
          if (n > 0) toast.show(t('vendor.synced'), 'success');
        });
    }
  }, [online, pending, t, toast]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 68, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: typeScale.caption.fontFamily, fontSize: 12, paddingBottom: 7 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="redeem"
        options={{
          title: t('vendor.tabRedeem'),
          tabBarIcon: ({ color }) => <Feather name="camera" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('vendor.tabHistory'),
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="list" color={color} size={24} />
              {pending > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    end: -8,
                    backgroundColor: colors.warning,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text variant="caption" style={{ fontSize: 10, color: '#241E1A' }}>
                    {pending}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
