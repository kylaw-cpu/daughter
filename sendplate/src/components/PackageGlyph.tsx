import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

export interface PackageGlyphProps {
  glyph: string; // 'kids_protein' | 'mother_baby' | 'family_staples' | 'clinic_vitamins'
  size?: number;
}

/**
 * The small custom SVG set for food/health package glyphs (spec §4).
 * Simple, warm, friendly shapes — readable at small sizes and to
 * low-literacy users. Falls back to a plate motif for unknown keys.
 */
export function PackageGlyph({ glyph, size = 56 }: PackageGlyphProps) {
  const theme = useTheme();
  const c = theme.colors;

  const art = (() => {
    switch (glyph) {
      case 'kids_protein':
        // A bowl of lentils with two eggs.
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Path d="M8 30 h40 a20 12 0 0 1 -40 0 Z" fill={c.primary} />
            <Path d="M8 30 h40" stroke={c.primaryDark} strokeWidth={2} />
            <Ellipse cx="21" cy="24" rx="7" ry="9" fill={c.surface} stroke={c.primaryDark} strokeWidth={2} />
            <Ellipse cx="34" cy="23" rx="7" ry="9" fill={c.surface} stroke={c.primaryDark} strokeWidth={2} />
            <Circle cx="14" cy="33" r="2" fill={c.primaryTint} />
            <Circle cx="28" cy="36" r="2" fill={c.primaryTint} />
            <Circle cx="41" cy="33" r="2" fill={c.primaryTint} />
          </Svg>
        );
      case 'mother_baby':
        // Mother figure cradling a small one, with a heart.
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Circle cx="24" cy="16" r="7" fill={c.accent} />
            <Path d="M10 44 c0 -12 8 -18 14 -18 c8 0 13 5 14 12 l1 6 Z" fill={c.accent} />
            <Circle cx="38" cy="32" r="4.5" fill={c.accentTint} stroke={c.accent} strokeWidth={2} />
            <Path
              d="M43 15 c2 -3 7 -2 7 2 c0 3 -4 5 -7 8 c-3 -3 -7 -5 -7 -8 c0 -4 5 -5 7 -2 Z"
              fill={c.primary}
            />
          </Svg>
        );
      case 'family_staples':
        // A grain sack with an iron (Fe-style) badge.
        return (
          <Svg width={56} height={56} viewBox="0 0 56 56" style={{ width: size, height: size }}>
            <Path d="M16 14 h24 l4 8 v20 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 v-20 Z" fill={c.primary} />
            <Path d="M16 14 l-4 8 h32 l-4 -8" fill={c.primaryDark} />
            <Path d="M22 30 q6 -6 12 0 q-6 6 -12 0 Z" fill={c.primaryTint} />
            <Circle cx="41" cy="41" r="9" fill={c.accent} />
            <Path d="M37 41 h8 M41 37 v8" stroke={c.accentTint} strokeWidth={2.5} strokeLinecap="round" />
          </Svg>
        );
      case 'clinic_vitamins':
        // A clinic cross with a vitamin capsule.
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Rect x="10" y="10" width="26" height="26" rx="8" fill={c.accentTint} />
            <Path d="M20 23 h12 M26 17 v12" stroke={c.accent} strokeWidth={5} strokeLinecap="round" />
            <Rect x="26" y="34" width="22" height="11" rx="5.5" fill={c.primary} transform="rotate(-20 37 39.5)" />
            <Path d="M31.5 41.5 l10 -3.6" stroke={c.surface} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        );
      default:
        // Fallback: a warm plate.
        return (
          <Svg width={size} height={size} viewBox="0 0 56 56">
            <Circle cx="28" cy="28" r="20" fill={c.primaryTint} />
            <Circle cx="28" cy="28" r="12" fill={c.primary} />
          </Svg>
        );
    }
  })();

  return (
    <View accessible={false} importantForAccessibility="no">
      {art}
    </View>
  );
}
