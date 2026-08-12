import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth';

/** Routes to the right "home" based on account role (spec §5). */
export default function Index() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (user.role === 'sender') return <Redirect href="/(sender)/home" />;
  if (user.role === 'recipient') return <Redirect href="/(recipient)/home" />;
  return <Redirect href="/(vendor)/redeem" />;
}
