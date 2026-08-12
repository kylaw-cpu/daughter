import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NotoSans_400Regular, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastHost } from '@/components';
import { useOnline } from '@/hooks/useOnline';
import { initI18n, loadPersistedLanguage } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { useVendorQueue } from '@/store/vendorQueueStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 2G-friendly defaults: don't hammer the network, keep data around.
      retry: 1,
      staleTime: 15_000,
      gcTime: 24 * 3600 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
  });
  const [i18nReady, setI18nReady] = useState(false);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateQueue = useVendorQueue((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      const persisted = await loadPersistedLanguage();
      initI18n(persisted);
      setI18nReady(true);
    })();
    hydrateAuth();
    hydrateQueue();
  }, [hydrateAuth, hydrateQueue]);

  const ready = fontsLoaded && i18nReady && authHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const theme = useTheme();
  // Mount the single network listener for the whole app.
  useOnline();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="unlock" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(sender)" />
        <Stack.Screen name="(recipient)" />
        <Stack.Screen name="(vendor)" />
        <Stack.Screen name="send" />
        <Stack.Screen name="order/[id]" />
        <Stack.Screen
          name="code/[id]"
          options={{ animation: 'fade', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="design" />
      </Stack>
      <ToastHost />
    </View>
  );
}
