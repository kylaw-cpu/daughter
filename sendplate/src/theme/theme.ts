/**
 * SendPlate design tokens — the single source of truth for color, type,
 * spacing, radius and shadow (spec §8). Do not hardcode values in screens;
 * import from here (usually via `useTheme()`).
 */
import { TextStyle } from 'react-native';

export const palette = {
  // Brand / primary — warm terracotta/amber
  primary: '#E8743B',
  primaryDark: '#C85A28',
  primaryTint: '#FBE6D8',
  // Secondary / accent — deep leaf green (health, trust, "collected")
  accent: '#2E7D5B',
  accentTint: '#DDEFE6',
  // Support / info — calm teal-blue
  info: '#3A7CA5',
  // Semantic
  success: '#2E7D5B',
  warning: '#E0A106',
  danger: '#C0392B',
} as const;

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryTint: string;
  accent: string;
  accentTint: string;
  info: string;
  infoTint: string;
  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  danger: string;
  dangerTint: string;
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  overlay: string;
  skeleton: string;
}

export const lightColors: ThemeColors = {
  ...palette,
  infoTint: '#DDEAF2',
  successTint: '#DDEFE6',
  warningTint: '#FAF0D2',
  dangerTint: '#F5DDD9',
  bg: '#FBF8F4', // warm off-white, not stark
  surface: '#FFFFFF',
  border: '#ECE6DE',
  textPrimary: '#241E1A',
  textSecondary: '#6B625B',
  textMuted: '#9A908A',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(36, 30, 26, 0.45)',
  skeleton: '#EFE9E2',
};

export const darkColors: ThemeColors = {
  ...palette,
  // Tints darken in dark mode so chips stay readable without glowing.
  primaryTint: '#3D2A1E',
  accentTint: '#1F3A2E',
  infoTint: '#1E3340',
  successTint: '#1F3A2E',
  warningTint: '#3D3418',
  dangerTint: '#3D211D',
  bg: '#1A1614',
  surface: '#241E1A',
  border: '#3A322C',
  textPrimary: '#F5F0EB',
  textSecondary: '#C4BAB2',
  textMuted: '#8F857D',
  textOnPrimary: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#2E2721',
};

/** Spacing scale (px). Base screen padding = 20; between cards = 12–16. */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  screen: 20,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

/** Radius tokens. Cards use `lg`; buttons use `pill` or `md`. */
export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/**
 * One soft, warm-tinted elevation token only (spec §8.3).
 * In dark mode prefer a hairline border instead of shadow.
 */
export const softShadow = {
  shadowColor: '#5B4636',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const;

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'button';

/**
 * Type scale (spec §8.2). Inter for Latin, Noto Sans fallback for broad
 * script coverage; both loaded in the root layout. Line height ~1.4.
 */
export const typography: Record<TextVariant, TextStyle> = {
  display: { fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 45 },
  h1: { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 36 },
  h2: { fontFamily: 'Inter_600SemiBold', fontSize: 21, lineHeight: 29 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 18, lineHeight: 25 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: 'Inter_500Medium', fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  button: { fontFamily: 'Inter_600SemiBold', fontSize: 17, lineHeight: 24 },
};

/** Motion durations (ms): 200–280, ease-out (spec §8.5). */
export const motion = {
  fast: 200,
  base: 240,
  slow: 280,
} as const;

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  shadow: typeof softShadow;
  motion: typeof motion;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  shadow: softShadow,
  motion,
  isDark: false,
};

export const darkTheme: Theme = {
  ...lightTheme,
  colors: darkColors,
  isDark: true,
};
