import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './Text';

export interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  action?: React.ReactNode;
}

/** Title, optional back, optional trailing action (spec §8.4). */
export function ScreenHeader({ title, showBack = true, onBack, action }: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={onBack ?? (() => router.back())}
          style={[styles.back, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill }]}
        >
          <Feather
            name={I18nManager.isRTL ? 'arrow-right' : 'arrow-left'}
            size={22}
            color={theme.colors.textPrimary}
          />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text variant="title" align="center" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.actionSlot}>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1 },
  actionSlot: { width: 44, alignItems: 'flex-end' },
});
