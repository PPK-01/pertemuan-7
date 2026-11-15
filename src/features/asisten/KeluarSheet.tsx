import { StyleSheet, Text } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export type KeluarSheetProps = {
  visible: boolean;
  /** true selama logout berjalan; tombol "Keluar" menampilkan spinner. */
  loading: boolean;
  /** Pesan bila logout gagal; sheet tetap terbuka. */
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function KeluarSheet({
  visible,
  loading,
  errorMessage,
  onClose,
  onConfirm,
}: KeluarSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={loading ? () => {} : onClose}
      title="Keluar dari akun?"
      primaryAction={{ label: 'Keluar', onPress: onConfirm, variant: 'danger', loading }}
      secondaryAction={{ label: 'Batal', onPress: onClose, disabled: loading }}
    >
      <Text style={styles.message}>Kamu perlu masuk lagi untuk membuka daftar sesi dan izin.</Text>
      {errorMessage ? (
        <Text role="alert" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  message: { ...typography.body, color: colors.textMuted },
  error: { ...typography.label, color: colors.feedback.danger.text },
});
