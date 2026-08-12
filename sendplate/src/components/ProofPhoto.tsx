import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProofPhotoProps {
  photoUrl: string;
  height?: number;
  radius?: number;
}

/**
 * Renders a proof-of-delivery photo. Real photos (file:// from the vendor
 * camera, or https:// in Phase 4) render directly; the mock world's
 * `mock://` URLs render as a warm stylized placeholder so the demo needs
 * no bundled photography.
 */
export function ProofPhoto({ photoUrl, height = 180, radius }: ProofPhotoProps) {
  const theme = useTheme();
  const borderRadius = radius ?? theme.radius.md;

  if (photoUrl.startsWith('mock://')) {
    return (
      <View
        accessibilityLabel="Delivery photo"
        style={[
          styles.placeholder,
          { height, borderRadius, backgroundColor: theme.colors.primaryTint },
        ]}
      >
        <Feather name="shopping-bag" size={40} color={theme.colors.primary} />
        <View style={[styles.stripe, { backgroundColor: theme.colors.primary, opacity: 0.15 }]} />
      </View>
    );
  }

  return (
    <Image
      accessibilityLabel="Delivery photo"
      accessibilityIgnoresInvertColors
      source={{ uri: photoUrl }}
      style={{ height, borderRadius, width: '100%' }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
  },
});
