import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { typeScale } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Recipient tabs: extra-large targets, icon + label always visible. */
export default function RecipientLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 72, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: typeScale.caption.fontFamily, fontSize: 13, paddingBottom: 8 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('recipient.tabHome'),
          tabBarIcon: ({ color }) => <Feather name="home" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: t('recipient.tabHealth'),
          tabBarIcon: ({ color }) => <Feather name="heart" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('recipient.tabProfile'),
          tabBarIcon: ({ color }) => <Feather name="user" color={color} size={26} />,
        }}
      />
      <Tabs.Screen name="code/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
