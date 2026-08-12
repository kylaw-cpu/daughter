/**
 * SendPlate design tokens — Section 8 of the build spec is authoritative.
 * Do not invent colors/spacing elsewhere; import from here.
 */

export const palette = {
  primary: '#E8743B',
  primaryDark: '#C85A28',
  primaryTint: '#FBE6D8',
  accent: '#2E7D5B',
  accentTint: '#DDEFE6',
  info: '#3A7CA5',
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
  success: string;
  warning: string;
  danger: string;
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Text drawn on top of `primary` / `accent` fills. */
  onPrimary: string;
}

export const lightColors: ThemeColors = {
  ...palette,
  bg: '#FBF8F4',
  surface: '#FFFFFF',
  border: '#ECE6DE',
  textPrimary: '#241E1A',
  textSecondary: '#6B625B',
  textMuted: '#9A908A',
  onPrimary: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  ...palette,
  bg: '#1A1614',
  surface: '#241E1A',
  border: '#3A322C',
  textPrimary: '#F5F0EB',
  textSecondary: '#C4BAB2',
  textMuted: '#9A908A',
  // Tints read as "washed out" on dark surfaces; deepen them slightly.
  primaryTint: '#3A2A20',
  accentTint: '#20342B',
  onPrimary: '#FFFFFF',
};

/** Spacing scale (px). Base screen padding = spacing.xl (20). */
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
  giant: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

/**
 * One soft, warm-tinted elevation token. In dark mode components should use a
 * hairline border instead (Card handles this).
 */
export const shadow = {
  soft: {
    shadowColor: '#8a5a3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type TypeVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'button';

export const typeScale: Record<
  TypeVariant,
  { fontSize: number; fontFamily: string; lineHeight: number }
> = {
  display: { fontSize: 32, fontFamily: 'Inter_700Bold', lineHeight: 45 },
  h1: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 36 },
  h2: { fontSize: 21, fontFamily: 'Inter_600SemiBold', lineHeight: 29 },
  title: { fontSize: 18, fontFamily: 'Inter_600SemiBold', lineHeight: 25 },
  body: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontFamily: 'Inter_500Medium', lineHeight: 22 },
  caption: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  button: { fontSize: 17, fontFamily: 'Inter_600SemiBold', lineHeight: 24 },
};

/** Minimum touch target (pt). Recipient-facing screens should aim larger. */
export const touchTarget = 44;

export const motion = {
  /** Standard transition duration range: 200–280ms, ease-out. */
  fast: 200,
  base: 240,
  slow: 280,
} as const;
