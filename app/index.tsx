import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';

/** Routes to the right "home" based on account role (spec §5). */
export default function Index() {
  const user = useAuth((s) => s.user);
  const hasPin = useAuth((s) => s.hasPin);
  const unlocked = useAuth((s) => s.unlocked);
  if (!user) return <Redirect href="/(auth)/welcome" />;
  // PIN opens the app (spec §6.1); once per launch.
  if (hasPin && !unlocked) return <Redirect href="/(auth)/unlock" />;
  if (user.role === 'sender') return <Redirect href="/(sender)/home" />;
  if (user.role === 'recipient') return <Redirect href="/(recipient)/home" />;
  return <Redirect href="/(vendor)/redeem" />;
}
