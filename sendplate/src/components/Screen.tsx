import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { OfflineBanner } from './OfflineBanner';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default). Set false for screens managing their own lists. */
  scroll?: boolean;
  /** Slim offline banner at the top (default on). */
  offlineBanner?: boolean;
  offlineMessage?: string;
  padded?: boolean;
  style?: ViewStyle;
  /** Pinned below the scroll area — e.g. a bottom-anchored primary button. */
  footer?: React.ReactNode;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

/** Standard screen scaffold: safe area, bg, base padding 20, offline banner. */
export function Screen({
  children,
  scroll = true,
  offlineBanner = true,
  offlineMessage,
  padded = true,
  style,
  footer,
  edges = ['top', 'bottom'],
}: ScreenProps) {
  const theme = useTheme();
  const padding = padded ? { paddingHorizontal: theme.spacing.screen } : null;

  return (
    <SafeAreaView edges={edges} style={[styles.safe, { backgroundColor: theme.colors.bg }]}>
      {offlineBanner ? <OfflineBanner message={offlineMessage} /> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[padding, styles.scrollContent, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, style]}>{children}</View>
      )}
      {footer ? (
        <View style={[padding, styles.footer]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  footer: { paddingTop: 8, paddingBottom: 8 },
});
