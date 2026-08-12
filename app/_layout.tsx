import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { initI18n, loadSavedLanguage } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/components';
import { useAuth } from '@/store/auth';
import { useNetworkSubscription } from '@/store/network';
import { useOfflineQueue } from '@/store/offlineQueue';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Server state defaults tuned for 2G: generous retry/backoff, cached reads
// served while stale so screens render instantly from cache.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15_000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigator() {
  const { colors, dark } = useTheme();
  useNetworkSubscription();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          animationDuration: 240,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  // Inter covers Latin; non-Latin scripts (Arabic etc.) fall back to the
  // platform's Noto-based system fonts, keeping the download under the 25 MB
  // target instead of bundling every Noto Sans script variant.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // If fonts fail (e.g. constrained web preview), render with system fallback
  // rather than blanking the app.
  const fontsReady = fontsLoaded || fontError != null;
  const [ready, setReady] = useState(false);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    (async () => {
      const saved = await loadSavedLanguage();
      initI18n(saved ?? undefined);
      await hydrate();
      await useOfflineQueue.getState().hydrate();
      setReady(true);
    })();
  }, [hydrate]);

  useEffect(() => {
    if (fontsReady && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, ready]);

  if (!fontsReady || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
