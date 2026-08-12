import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { OfflineBanner } from './OfflineBanner';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default) vs fixed layout. */
  scroll?: boolean;
  /** Content pinned under the scroll area (e.g. bottom-anchored CTA). */
  footer?: React.ReactNode;
  offlineMessage?: string;
  style?: ViewStyle;
  edgesTop?: boolean;
}

/** Standard screen shell: bg token, base padding 20, offline banner, safe areas. */
export function Screen({ children, scroll = true, footer, offlineMessage, style, edgesTop = true }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[{ padding: spacing.xl, paddingBottom: spacing.giant }, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1, padding: spacing.xl }, style]}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: edgesTop ? insets.top : 0 }}>
      <OfflineBanner message={offlineMessage} />
      <View style={{ flex: 1 }}>{content}</View>
      {footer != null && (
        <View
          style={{
            padding: spacing.xl,
            paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.xs,
            backgroundColor: colors.bg,
          }}
        >
          {footer}
        </View>
      )}
    </View>
  );
}
