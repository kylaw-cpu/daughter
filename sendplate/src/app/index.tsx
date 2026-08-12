import { Redirect } from 'expo-router';
import React from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Entry gate: the app decides the user's "home" based on account role
 * after login (spec §5).
 */
export default function Index() {
  const user = useAuthStore((s) => s.user);
  const hasPin = useAuthStore((s) => s.hasPin);
  const unlocked = useAuthStore((s) => s.unlocked);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (hasPin && !unlocked) return <Redirect href="/unlock" />;
  switch (user.role) {
    case 'sender':
      return <Redirect href="/(sender)/home" />;
    case 'recipient':
      return <Redirect href="/(recipient)/home" />;
    case 'vendor':
      return <Redirect href="/(vendor)/redeem" />;
  }
}
