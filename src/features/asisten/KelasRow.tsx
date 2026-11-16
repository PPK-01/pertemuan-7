import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { KelasPraktikum } from '@/types';

export type KelasRowProps = {
  kelas: Pick<KelasPraktikum, 'praktikum' | 'kelas'>;
  /** Membuka form ubah kelas ini. */
  onPress: () => void;
};

/** Satu baris daftar kelas praktikum. */
export function KelasRow({ kelas, onPress }: KelasRowProps) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={`${kelas.praktikum}, Kelas ${kelas.kelas}. Ubah atau hapus`}
      style={({ pressed }) => [styles.row, pressed && { opacity: PRESSED_OPACITY }]}
    >
      <View style={styles.text}>
        <Text style={styles.praktikum}>{kelas.praktikum}</Text>
        <Text style={styles.kelas}>{`Kelas ${kelas.kelas}`}</Text>
      </View>
      <Text style={styles.hint}>Ubah</Text>
    </Pressable>
  );
}

// Garis tepi tipis sama dengan Banner dan Button; belum ada token lebar garis.
const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: layout.minTouch,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
  },
  text: { flex: 1, gap: spacing.xs },
  praktikum: { ...typography.heading, color: colors.primary },
  kelas: { ...typography.body, color: colors.text },
  hint: { ...typography.label, color: colors.primary },
});
