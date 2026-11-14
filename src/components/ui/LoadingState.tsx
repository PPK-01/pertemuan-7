import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type LoadingStateProps = {
  /** Teks di bawah indikator; juga dibacakan pembaca layar. */
  label?: string;
  /** Mengisi layar dan terpusat, untuk gate auth atau listener awal. */
  fullScreen?: boolean;
  /** @deprecated Pakai `label`; dihapus setelah pemanggil dimigrasi. */
  message?: string;
};

const DEFAULT_LABEL = 'Memuat…';

export function LoadingState({ label, fullScreen = false, message }: LoadingStateProps) {
  const text = label ?? message ?? DEFAULT_LABEL;
  // Pemanggil lama (prop message) mengandalkan flex: 1; dipertahankan sampai dimigrasi.
  const fill = fullScreen || message !== undefined;

  return (
    <View
      role="progressbar"
      aria-busy
      aria-live="polite"
      aria-label={text}
      style={[styles.container, fill && styles.fullScreen]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>{text}</Text>
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
