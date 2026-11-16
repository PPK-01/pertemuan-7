import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { KelasPraktikum } from '@/types';

export type DeleteKelasSheetProps = {
  visible: boolean;
  kelas: Pick<KelasPraktikum, 'praktikum' | 'kelas'>;
  /** Tombol "Hapus" menampilkan spinner dan sheet tidak bisa ditutup selama menunggu. */
  loading?: boolean;
  /** Mis. offline; tombol "Hapus" nonaktif. */
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteKelasSheet({
  visible,
  kelas,
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
}: DeleteKelasSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Hapus kelas"
      primaryAction={{ label: 'Hapus', variant: 'danger', onPress: onConfirm, loading, disabled }}
      secondaryAction={{ label: 'Batal', onPress: onClose, disabled: loading }}
    >
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{kelas.praktikum}</Text>
        <Text style={styles.body}>{`Kelas ${kelas.kelas}`}</Text>
      </View>
      <Text style={styles.body}>
        Kelas ini tidak bisa lagi dipilih saat membuat sesi atau saat praktikan mendaftar.
      </Text>
      {/* Banner belum punya tone warning; bingkai mengikuti peringatan di DeleteSessionSheet. */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>Kelas yang dihapus tidak bisa dikembalikan.</Text>
      </View>
    </BottomSheet>
  );
}

// Garis tepi tipis sama dengan Banner dan Button; belum ada token lebar garis.
const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
  summary: {
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryTitle: { ...typography.label, color: colors.text },
  body: { ...typography.body, color: colors.text },
  warning: {
    backgroundColor: colors.feedback.warning.bg,
    borderColor: colors.feedback.warning.text,
    borderWidth: BORDER_WIDTH,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { ...typography.label, color: colors.feedback.warning.text },
});
