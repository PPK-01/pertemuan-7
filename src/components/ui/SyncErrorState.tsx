import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type SyncErrorStateProps = {
  /** Penjelasan singkat, mis. "Gagal memuat data. Periksa koneksi lalu coba lagi." */
  message: string;
  /** Ada = tombol "Coba lagi" tampil. */
  onRetry?: () => void;
  /** Tombol "Coba lagi" menampilkan spinner (aria-busy) dan tidak bisa ditekan. */
  retrying?: boolean;
  /** Varian ringkas satu baris untuk dipakai di dalam Card atau bagian layar. */
  compact?: boolean;
  /** Khusus layout (margin, flex, alignSelf), bukan warna/ukuran. */
  style?: StyleProp<ViewStyle>;
};

// Varian ringkas: pesan memakai sedikitnya 60% lebar baris; bila tombol tidak muat di sisa
// lebarnya, tombol turun ke baris berikut alih-alih memeras pesan.
const COMPACT_MESSAGE_BASIS = '60%';

/**
 * Error sinkronisasi data dengan tombol "Coba lagi" (NFR-02). Komponen hanya menerima props;
 * layar yang menentukan listener mana yang dipasang ulang.
 *
 * Pesan diumumkan lewat aria-live="polite" seperti Banner, bukan role="alert": alert di
 * TalkBack memotong bacaan yang sedang berjalan, padahal error ini muncul tanpa aksi pengguna.
 */
export function SyncErrorState({
  message,
  onRetry,
  retrying = false,
  compact = false,
  style,
}: SyncErrorStateProps) {
  const { bg, text } = colors.feedback.danger;

  return (
    <View
      style={[
        compact ? styles.compact : styles.container,
        { backgroundColor: bg, borderColor: text },
        style,
      ]}
    >
      <Text
        aria-live="polite"
        style={[compact ? styles.compactMessage : styles.message, { color: text }]}
      >
        {message}
      </Text>
      {onRetry ? (
        <Button
          label="Coba lagi"
          accessibilityLabel="Coba lagi memuat data"
          onPress={onRetry}
          loading={retrying}
          variant={compact ? 'ghost' : 'secondary'}
          style={compact ? styles.compactAction : styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  message: typography.body,
  action: { alignSelf: 'flex-start' },
  compact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
  },
  compactMessage: { ...typography.label, flex: 1, flexBasis: COMPACT_MESSAGE_BASIS },
  compactAction: { marginLeft: 'auto' },
});
