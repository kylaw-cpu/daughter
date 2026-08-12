import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { typeScale } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Sender bottom tabs: icon + label always visible, large targets (spec §5). */
export default function SenderLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 64, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: typeScale.caption.fontFamily, fontSize: 12, paddingBottom: 6 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('sender.tabHome'),
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: t('sender.tabActivity'),
          tabBarIcon: ({ color, size }) => <Feather name="image" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('sender.tabProfile'),
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
      {/* Stack flows live inside the tab navigator but hide the tab bar */}
      <Tabs.Screen name="send" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="order/[id]" options={{ href: null }} />
      <Tabs.Screen name="add-recipient" options={{ href: null }} />
    </Tabs>
  );
}
