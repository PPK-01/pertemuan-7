import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type LoadingStateProps = {
  /** Teks di bawah indikator; juga dibacakan pembaca layar. */
  label?: string;
  /** Mengisi layar dan terpusat, untuk gate auth atau listener awal. */
  fullScreen?: boolean;
};

export function LoadingState({ label = 'Memuat…', fullScreen = false }: LoadingStateProps) {
  return (
    <View
      role="progressbar"
      aria-busy
      aria-live="polite"
      aria-label={label}
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  label: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
