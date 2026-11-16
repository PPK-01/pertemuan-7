import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Kelas } from '@/types';

export type StatusAction = 'open' | 'close';

export type StatusActionSheetProps = {
  visible: boolean;
  action: StatusAction;
  kelas: Kelas;
  /** Tombol konfirmasi menampilkan spinner dan sheet tidak bisa ditutup selama menunggu. */
  loading?: boolean;
  /** Mis. offline; tombol konfirmasi nonaktif. */
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function StatusActionSheet({
  visible,
  action,
  kelas,
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
}: StatusActionSheetProps) {
  const isOpen = action === 'open';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isOpen ? 'Buka sesi' : 'Tutup sesi'}
      primaryAction={{
        label: isOpen ? 'Buka sesi' : 'Tutup sesi',
        variant: isOpen ? 'primary' : 'danger',
        onPress: onConfirm,
        loading,
        disabled,
      }}
      secondaryAction={{ label: 'Batal', onPress: onClose, disabled: loading }}
    >
      <Text style={styles.body}>
        {isOpen
          ? `Setelah dibuka, praktikan kelas ${kelas} bisa presensi memakai kode sesi.`
          : 'Praktikan tidak bisa presensi lagi setelah sesi ditutup.'}
      </Text>
      {/* Banner belum punya tone warning; bingkai dan warna mengikuti Banner, teks memakai label agar menonjol. */}
      {isOpen ? null : (
        <View style={styles.warning}>
          <Text style={styles.warningText}>Sesi yang ditutup tidak bisa dibuka kembali.</Text>
        </View>
      )}
    </BottomSheet>
  );
}

// Garis tepi tipis sama dengan Banner dan Button; belum ada token lebar garis.
const BORDER_WIDTH = 1;

const styles = StyleSheet.create({
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
