import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type OfflineBannerProps = {
  /** Status koneksi dari pemanggil; komponen tidak membaca store atau NetInfo sendiri. */
  isOnline?: boolean;
  message?: string;
};

const DEFAULT_MESSAGE =
  'Tidak ada koneksi. Data terakhir tetap tampil, perubahan belum bisa disimpan.';
const ICON_SIZE = 20;

const { bg, text } = colors.feedback.warning;

/**
 * Pita peringatan di bagian atas layar, bukan overlay: konten di bawahnya ikut turun.
 * Dirancang dipasang paling atas, jadi menambahkan inset atas safe area sendiri.
 */
export function OfflineBanner({ isOnline = false, message = DEFAULT_MESSAGE }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View
      role="alert"
      aria-live="polite"
      style={[
        styles.banner,
        {
          paddingTop: insets.top + spacing.sm,
          paddingLeft: insets.left + spacing.lg,
          paddingRight: insets.right + spacing.lg,
        },
      ]}
    >
      <View aria-hidden style={styles.icon}>
        <Text style={styles.iconGlyph}>!</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: bg,
    borderBottomWidth: 1,
    borderBottomColor: text,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: radius.full,
    backgroundColor: text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    ...typography.caption,
    fontWeight: '700',
    color: bg,
  },
  message: {
    ...typography.label,
    color: text,
    flex: 1,
  },
});
