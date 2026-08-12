import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

const HUES = ['#E8743B', '#2E7D5B', '#3A7CA5', '#B0713A', '#7B5EA7'];

/** Photo when available, otherwise warm colored initials. */
export function Avatar({ name, photoUrl, size = 52 }: { name: string; photoUrl?: string; size?: number }) {
  const { colors } = useTheme();
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const bg = HUES[hash % HUES.length] ?? HUES[0]!;

  if (photoUrl) {
    return (
      <Image
        source={{ uri: photoUrl }}
        accessibilityLabel={name}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }}
      />
    );
  }
  return (
    <View
      accessibilityLabel={name}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${bg}33`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant={size >= 48 ? 'title' : 'bodyStrong'} style={{ color: bg }}>
        {initials || '·'}
      </Text>
    </View>
  );
}
