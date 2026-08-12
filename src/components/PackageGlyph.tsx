import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { radius } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Small custom SVG glyph set for the package cards (spec §4 "a small custom
 * SVG set for the food/health package glyphs"). Warm, rounded, non-clinical.
 */
export function PackageGlyph({ glyph, size = 56 }: { glyph: string; size?: number }) {
  const { colors } = useTheme();
  const stroke = colors.primaryDark;
  const fill = colors.primaryTint;
  const accent = colors.accent;

  let art: React.ReactNode;
  switch (glyph) {
    case 'kids_protein': // eggs + lentils bowl
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Path d="M6 28h36c0 8-8 14-18 14S6 36 6 28Z" fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
          <Ellipse cx="17" cy="20" rx="6" ry="7.5" fill="#fff" stroke={stroke} strokeWidth={2.5} />
          <Ellipse cx="30" cy="19" rx="6" ry="7.5" fill="#fff" stroke={stroke} strokeWidth={2.5} />
          <Circle cx="12" cy="31" r="1.6" fill={accent} />
          <Circle cx="20" cy="33" r="1.6" fill={accent} />
          <Circle cx="28" cy="32" r="1.6" fill={accent} />
          <Circle cx="35" cy="30" r="1.6" fill={accent} />
        </Svg>
      );
      break;
    case 'mother_baby': // heart + small leaf
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Path
            d="M24 41S7 30 7 18.5C7 12.7 11.6 9 16.4 9c3.3 0 6.1 1.7 7.6 4.4C25.5 10.7 28.3 9 31.6 9 36.4 9 41 12.7 41 18.5 41 30 24 41 24 41Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Path d="M24 30c0-6 3-9 8-9-0.5 6-3.5 9-8 9Z" fill={accent} opacity={0.85} />
        </Svg>
      );
      break;
    case 'family_staples': // grain sack
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Path d="M14 14h20l4 8v14a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6V22l4-8Z" fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M18 14c0-4 2.5-7 6-7s6 3 6 7" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M24 24v10M20 27l4-3 4 3" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
      break;
    case 'clinic_visit': // cross + pulse
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Rect x="8" y="10" width="32" height="30" rx="8" fill={fill} stroke={stroke} strokeWidth={2.5} />
          <Path d="M24 18v12M18 24h12" stroke={accent} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M8 6h8M12 2v8" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
      break;
    case 'elderly_care': // rice bowl with chopsticks + heart
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Path d="M8 24h32c0 9-7 16-16 16S8 33 8 24Z" fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M12 40h24" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M14 18 40 8M20 20 44 12" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
          <Path
            d="M24 32s-6-3.6-6-7.4c0-2 1.6-3.3 3.3-3.3 1.1 0 2.1.6 2.7 1.5.6-.9 1.6-1.5 2.7-1.5 1.7 0 3.3 1.3 3.3 3.3 0 3.8-6 7.4-6 7.4Z"
            fill={accent}
            opacity={0.9}
          />
        </Svg>
      );
      break;
    default:
      art = (
        <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 48 48" fill="none">
          <Circle cx="24" cy="24" r="16" fill={fill} stroke={stroke} strokeWidth={2.5} />
        </Svg>
      );
  }

  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {art}
    </View>
  );
}
