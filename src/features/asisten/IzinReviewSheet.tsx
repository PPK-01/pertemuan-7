import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getSaranLabel } from '@/components/izin/AiSuggestionCard';
import type { AiSaran } from '@/components/izin/AiSuggestionCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TextField } from '@/components/ui/TextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type ReviewDecision = 'approved' | 'rejected';

/** Batas catatan keputusan (SRS §4.2). */
export const CATATAN_MAX_LENGTH = 200;

/** Catatan opsional untuk Setujui maupun Tolak (FR-26); hanya panjangnya yang dibatasi. */
export function validateCatatan(catatan: string): string | undefined {
  return catatan.trim().length > CATATAN_MAX_LENGTH
    ? `Catatan maksimal ${CATATAN_MAX_LENGTH} karakter.`
    : undefined;
}

/**
 * Penanda wajib saat keputusan berbeda dari saran AI `diterima`/`ditolak` (FR-26).
 * Saran `perlu_cek` atau tanpa saran tidak memicu penanda.
 */
export function differsFromAi(decision: ReviewDecision, saran: AiSaran | undefined): boolean {
  if (saran === 'diterima') return decision === 'rejected';
  if (saran === 'ditolak') return decision === 'approved';
  return false;
}

const COPY = {
  approved: {
    title: 'Setujui izin',
    body: 'Praktikan tercatat izin di rekap sesi dan tidak perlu presensi.',
  },
  rejected: {
    title: 'Tolak izin',
    body: 'Praktikan tetap dihitung belum hadir bila tidak presensi.',
  },
} as const satisfies Record<ReviewDecision, { title: string; body: string }>;

export type IzinReviewSheetProps = {
  visible: boolean;
  /** Aksi terakhir; dipertahankan pemanggil selama animasi tutup agar teks tidak berganti. */
  decision: ReviewDecision;
  praktikanName: string;
  sessionLabel: string;
  /** Saran AI yang berhasil; kosong bila AI belum selesai atau gagal. */
  aiSaran?: AiSaran;
  /** Tombol konfirmasi menampilkan spinner dan sheet tidak bisa ditutup selama menunggu. */
  loading?: boolean;
  /** Mis. offline; tombol konfirmasi nonaktif. */
  disabled?: boolean;
  /** Catatan sudah dipangkas; string kosong berarti tanpa catatan. */
  onConfirm: (catatan: string) => void;
  onClose: () => void;
};

export function IzinReviewSheet({
  visible,
  decision,
  praktikanName,
  sessionLabel,
  aiSaran,
  loading = false,
  disabled = false,
  onConfirm,
  onClose,
}: IzinReviewSheetProps) {
  const [catatan, setCatatan] = useState('');
  // Validasi baru tampil setelah konfirmasi pertama, agar tidak menegur saat masih mengetik.
  const [submitted, setSubmitted] = useState(false);

  // Isi dikosongkan setiap kali sheet dibuka lagi; disetel saat render agar tidak ada frame
  // yang masih menampilkan catatan untuk izin atau aksi sebelumnya.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setCatatan('');
      setSubmitted(false);
    }
  }

  const error = submitted ? validateCatatan(catatan) : undefined;
  const copy = COPY[decision];
  const showDiffers = differsFromAi(decision, aiSaran);
  const length = catatan.trim().length;

  const handleConfirm = () => {
    setSubmitted(true);
    if (validateCatatan(catatan)) return;
    onConfirm(catatan.trim());
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={copy.title}
      primaryAction={{
        label: copy.title,
        variant: decision === 'approved' ? 'primary' : 'danger',
        onPress: handleConfirm,
        loading,
        disabled,
      }}
      secondaryAction={{ label: 'Batal', onPress: onClose, disabled: loading }}
    >
      <View style={styles.summary}>
        <Text style={styles.name}>{praktikanName}</Text>
        <Text style={styles.session}>{sessionLabel}</Text>
      </View>
      <Text style={styles.body}>{copy.body}</Text>

      {showDiffers && aiSaran ? (
        // Banner belum punya tone warning; bingkai dan warna mengikuti pola StatusActionSheet.
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            {`Keputusan ini berbeda dari saran AI (${getSaranLabel(aiSaran)}).`}
          </Text>
        </View>
      ) : null}

      <TextField
        label="Catatan untuk praktikan (opsional)"
        value={catatan}
        onChangeText={setCatatan}
        placeholder="Mis. Lampirkan surat dokter di pertemuan berikutnya."
        hint={`${length}/${CATATAN_MAX_LENGTH} karakter`}
        error={error}
        autoCapitalize="sentences"
        disabled={loading}
      />

      <Text style={styles.caption}>Keputusan tidak dapat diubah setelah disimpan.</Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.xs / 2 },
  name: { ...typography.label, color: colors.text },
  session: { ...typography.caption, color: colors.textMuted },
  body: { ...typography.body, color: colors.text },
  warning: {
    backgroundColor: colors.feedback.warning.bg,
    borderColor: colors.feedback.warning.text,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { ...typography.label, color: colors.feedback.warning.text },
  caption: { ...typography.caption, color: colors.textMuted },
});
