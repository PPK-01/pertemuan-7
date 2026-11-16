import { StyleSheet, Text, View } from 'react-native';

import { formatSessionTime, sessionTimeText } from '@/components/session/sessionTime';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Session } from '@/types';

export type DeleteSessionSheetProps = {
  visible: boolean;
  session: Pick<Session, 'praktikum' | 'kelas' | 'topik' | 'startAt' | 'endAt'>;
  /** Jumlah pengajuan izin untuk sesi ini; dokumen izin tidak ikut terhapus. */
  izinCount: number;
  /** Tombol "Hapus" menampilkan spinner dan sheet tidak bisa ditutup selama menunggu. */
  loading?: boolean;
  /** Mis. offline; tombol "Hapus" nonaktif. */
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteSessionSheet({
  visible,
  session,
  izinCount,
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
}: DeleteSessionSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Hapus sesi"
      primaryAction={{ label: 'Hapus', variant: 'danger', onPress: onConfirm, loading, disabled }}
      secondaryAction={{ label: 'Batal', onPress: onClose, disabled: loading }}
    >
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{`${session.praktikum} · Kelas ${session.kelas}`}</Text>
        <Text style={styles.body}>{session.topik}</Text>
        <Text style={styles.time}>{formatSessionTime(session)}</Text>
      </View>
      {izinCount > 0 ? (
        <Text style={styles.body}>
          {`Ada ${izinCount} pengajuan izin untuk sesi ini. Pengajuan itu tidak ikut terhapus.`}
        </Text>
      ) : null}
      {/* Banner belum punya tone warning; bingkai mengikuti peringatan di StatusActionSheet. */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>Sesi yang dihapus tidak bisa dikembalikan.</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryTitle: { ...typography.label, color: colors.text },
  body: { ...typography.body, color: colors.text },
  time: { ...sessionTimeText, color: colors.textMuted },
  warning: {
    backgroundColor: colors.feedback.warning.bg,
    borderColor: colors.feedback.warning.text,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { ...typography.label, color: colors.feedback.warning.text },
});
