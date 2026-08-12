import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface AvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
}

/** Photo, or colored initials derived deterministically from the name. */
export function Avatar({ name, photoUrl, size = 48 }: AvatarProps) {
  const theme = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // A small warm palette; index picked from the name so it is stable.
  const swatches = [
    { bg: theme.colors.primaryTint, fg: theme.colors.primaryDark },
    { bg: theme.colors.accentTint, fg: theme.colors.accent },
    { bg: theme.colors.infoTint, fg: theme.colors.info },
    { bg: theme.colors.warningTint, fg: theme.isDark ? theme.colors.warning : '#8A6404' },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const swatch = swatches[Math.abs(hash) % swatches.length];

  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image accessibilityIgnoresInvertColors source={{ uri: photoUrl }} style={shape} />;
  }
  return (
    <View
      accessible={false}
      style={[styles.circle, shape, { backgroundColor: swatch.bg }]}
    >
      <Text
        variant={size >= 56 ? 'title' : 'bodyStrong'}
        style={{ color: swatch.fg }}
        allowFontScaling={false}
      >
        {initials || '•'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
