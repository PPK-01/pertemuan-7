import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { IZIN_FILTER_LABEL } from '@/features/asisten/izinFilterLabels';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type IzinShortcutProps = {
  /** Jumlah izin berstatus pending_ai + pending_review (FR-25). */
  pendingCount: number;
  /** Status listener izin; angka hanya ditampilkan saat 'ready' agar 0 tidak menyesatkan. */
  countStatus: 'loading' | 'ready' | 'error';
  onPress: () => void;
};

// Lebar minimum badge setara tingginya (satu baris typography.label) agar badge tidak
// lebih sempit dari tingginya; angka lebih panjang melebar menjadi pil.
const BADGE_MIN_WIDTH = typography.label.lineHeight;
// Batas tampilan angka; jumlah lengkap tetap dibacakan lewat aria-label.
const MAX_SHOWN_COUNT = 99;

function izinAriaLabel(count: number, status: IzinShortcutProps['countStatus']): string {
  if (status === 'loading') return 'Izin, jumlah sedang dimuat';
  if (status === 'error') return 'Izin, jumlah gagal dimuat';
  return count > 0 ? `Izin, ${count} perlu diperiksa` : 'Izin, tidak ada yang perlu diperiksa';
}

function izinHint(count: number, status: IzinShortcutProps['countStatus']): string {
  if (status === 'loading') return 'Memuat jumlah';
  if (status === 'error') return 'Jumlah gagal dimuat';
  // Sama dengan chip filter default di daftar izin.
  return count > 0 ? IZIN_FILTER_LABEL.pending : 'Lihat daftar';
}

export function IzinShortcut({ pendingCount, countStatus, onPress }: IzinShortcutProps) {
  const shownCount = pendingCount > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : String(pendingCount);
  const showBadge = countStatus === 'ready' && pendingCount > 0;

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={izinAriaLabel(pendingCount, countStatus)}
      style={({ pressed }) => [styles.button, pressed && { opacity: PRESSED_OPACITY }]}
    >
      <Text style={styles.label}>Izin</Text>
      {showBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{shownCount}</Text>
        </View>
      ) : null}
      <View style={styles.spacer} />
      <Text style={styles.hint}>{izinHint(pendingCount, countStatus)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { ...typography.label, color: colors.text },
  badge: {
    minWidth: BADGE_MIN_WIDTH,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.izin.pending_review.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...typography.label, color: colors.izin.pending_review.text },
  spacer: { flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted },
});
