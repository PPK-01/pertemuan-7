import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { colors } from '@/theme/colors';
import type { ColorPair } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { AiErrorCode, AiResult, IzinKategori } from '@/types';

type AiSuccess = Extract<AiResult, { state: 'success' }>;
export type AiSaran = AiSuccess['saran'];
type AiSentimen = AiSuccess['sentimen'];

export type AiSuggestionCardProps = {
  /** Kosong = analisis belum selesai (izin masih `pending_ai`); kartu menampilkan state memuat. */
  ai?: AiResult;
  /**
   * Tombol "Coba lagi analisis AI" hanya tampil bila ada dan `ai.state === 'failed'` (FR-24).
   * Berikan hanya selama izin masih bisa diperiksa; kartu gagal memakai keberadaannya untuk
   * menampilkan keterangan bahwa asisten tetap dapat memutuskan.
   */
  onRetry?: () => void;
  /** Analisis ulang sedang berjalan; tombol menampilkan spinner. */
  retrying?: boolean;
  /** Mis. offline; tombol coba lagi nonaktif. */
  retryDisabled?: boolean;
};

/** Teks saran AI (FR-26), dipakai juga oleh sheet pemeriksaan untuk penanda beda saran. */
export const AI_SARAN_LABEL = {
  diterima: 'Diterima',
  ditolak: 'Ditolak',
  perlu_cek: 'Perlu dicek',
} as const satisfies Record<AiSaran, string>;

// Makna tidak hanya dari warna: teks saran selalu tampil. perlu_cek memakai warning (DESIGN.md).
const SARAN_TONE = {
  diterima: colors.feedback.success,
  ditolak: colors.feedback.danger,
  perlu_cek: colors.feedback.warning,
} as const satisfies Record<AiSaran, ColorPair>;

export const IZIN_KATEGORI_LABEL = {
  sakit: 'Sakit',
  keluarga: 'Keluarga',
  akademik: 'Akademik',
  lainnya: 'Lainnya',
  tidak_jelas: 'Tidak jelas',
} as const satisfies Record<IzinKategori, string>;

const SENTIMEN_LABEL = {
  positif: 'Positif',
  netral: 'Netral',
  negatif: 'Negatif',
} as const satisfies Record<NonNullable<AiSentimen>, string>;

const AI_ERROR_CAUSE = {
  MODEL_ERROR: 'Model AI tidak dapat dijalankan',
} as const satisfies Record<AiErrorCode, string>;

/** Data Firestore bisa memuat nilai di luar tipe; tampilkan apa adanya daripada kosong. */
export function getKategoriLabel(kategori: IzinKategori): string {
  return IZIN_KATEGORI_LABEL[kategori] ?? kategori;
}

export function getSaranLabel(saran: AiSaran): string {
  return AI_SARAN_LABEL[saran] ?? saran;
}

function getSentimenLabel(sentimen: AiSentimen): string {
  // null = kata tidak dikenali model; bukan kegagalan (SRS §5.4).
  return sentimen ? (SENTIMEN_LABEL[sentimen] ?? sentimen) : 'Tidak dikenali';
}

function ExperimentalTag() {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>Eksperimental</Text>
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <Text role="heading" style={styles.title}>
        {title}
      </Text>
      <ExperimentalTag />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const DISCLAIMER = 'Saran AI hanya bahan pertimbangan. Keputusan tetap di tangan asisten.';

export function AiSuggestionCard({
  ai,
  onRetry,
  retrying = false,
  retryDisabled = false,
}: AiSuggestionCardProps) {
  if (!ai) {
    return (
      <Card>
        <View style={styles.content}>
          <Header title="Saran AI" />
          <LoadingState label="Menunggu analisis AI…" />
        </View>
      </Card>
    );
  }

  if (ai.state === 'failed') {
    const cause = AI_ERROR_CAUSE[ai.errorCode] ?? 'Penyebab tidak diketahui';
    return (
      <Card>
        <View style={styles.content}>
          <Header title="Analisis AI gagal" />
          <Text style={styles.body}>{`Penyebab: ${cause} (${ai.errorCode}).`}</Text>
          {onRetry ? (
            // onRetry hanya diberikan selama izin masih bisa diperiksa; setelah diputuskan,
            // kalimat ini justru menyesatkan.
            <Text style={styles.muted}>Kamu tetap dapat memutuskan izin ini tanpa saran AI.</Text>
          ) : null}
          {onRetry ? (
            <Button
              label="Coba lagi analisis AI"
              variant="secondary"
              onPress={onRetry}
              loading={retrying}
              disabled={retryDisabled}
            />
          ) : null}
        </View>
      </Card>
    );
  }

  const saranLabel = getSaranLabel(ai.saran);
  const kategoriLabel = getKategoriLabel(ai.kategori);
  const tone = SARAN_TONE[ai.saran] ?? colors.feedback.warning;

  return (
    <Card accessibilityLabel={`Saran AI eksperimental: ${saranLabel}, kategori ${kategoriLabel}`}>
      <View style={styles.content}>
        <Header title="Saran AI" />
        <View style={[styles.saranBox, { backgroundColor: tone.bg, borderColor: tone.text }]}>
          <Text style={[styles.saranCaption, { color: tone.text }]}>Saran</Text>
          <Text style={[styles.saranValue, { color: tone.text }]}>{saranLabel}</Text>
        </View>
        <View style={styles.infoList}>
          <InfoRow label="Kategori" value={kategoriLabel} />
          <InfoRow label="Sentimen teks (eksperimental)" value={getSentimenLabel(ai.sentimen)} />
        </View>
        {ai.penjelasan ? <Text style={styles.muted}>{ai.penjelasan}</Text> : null}
        <Text style={styles.muted}>{DISCLAIMER}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.text, flexShrink: 1 },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  tagText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  saranBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs / 2,
  },
  saranCaption: typography.caption,
  saranValue: typography.heading,
  infoList: { gap: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    columnGap: spacing.md,
  },
  infoLabel: { ...typography.body, color: colors.textMuted },
  infoValue: { ...typography.body, fontWeight: '600', color: colors.text },
  body: { ...typography.body, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted },
});
