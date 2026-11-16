import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AiSuggestionCard } from '@/components/izin/AiSuggestionCard';
import { IzinStatusBadge, getIzinStatusLabel } from '@/components/izin/IzinStatusBadge';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { goBackToList } from '@/features/asisten/goBackToList';
import {
  IZIN_ALREADY_REVIEWED_MESSAGE,
  izinReviewErrorMessage,
} from '@/features/asisten/izinErrorMessage';
import { izinFilterOf } from '@/features/asisten/izinFilterLabels';
import { IzinReviewSheet } from '@/features/asisten/IzinReviewSheet';
import type { ReviewDecision } from '@/features/asisten/IzinReviewSheet';
import { getIzinSessionLabel, getPraktikanName } from '@/features/asisten/izinSessionLabel';
import { OFFLINE_ACTION_HINT, writeErrorMessage } from '@/features/asisten/writeErrorMessage';
import {
  useAppStore,
  useIsOnline,
  useIzinById,
  useSessionById,
  useSyncState,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { IzinStatus } from '@/types';
import { formatDateTime } from '@/utils/time';

// id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar.
type Feedback = { id: number; tone: 'success' | 'danger' | 'info'; message: string };

const SUCCESS_MESSAGE: Record<ReviewDecision, string> = {
  approved: 'Izin disetujui',
  rejected: 'Izin ditolak',
};

/** Sama dengan filter "Perlu diperiksa": pending_ai, pending_review, dan status tak dikenal. */
function isReviewable(status: IzinStatus | undefined): boolean {
  return status !== undefined && izinFilterOf(status) === 'pending';
}

// Bila rules menolak karena izin sudah diputuskan sebelum listener sempat memperbarui store,
// Result-nya PERMISSION_DENIED, bukan CONFLICT. Status terbaru dibaca langsung dari store
// (bukan dari closure render) agar kasus itu tetap dikenali sebagai "sudah diperiksa".
function latestIzinStatus(izinId: string): IzinStatus | undefined {
  return useAppStore.getState().izinList.find((i) => i.id === izinId)?.status;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AsistenDetailIzinScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const izinId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const izin = useIzinById(izinId);
  const izinSync = useSyncState('izin');
  const session = useSessionById(izin?.sessionId ?? '');
  const sessionsSync = useSyncState('sessions');
  const sessionsLoading = sessionsSync === 'idle' || sessionsSync === 'loading';
  const isOnline = useIsOnline();
  const retryAi = useAppStore((state) => state.retryAi);
  const reviewIzin = useAppStore((state) => state.reviewIzin);

  // retryAi sedang menunggu Result; ref menahan tekanan beruntun sebelum render berikutnya.
  const [retrying, setRetrying] = useState(false);
  const retryingRef = useRef(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Sheet tetap terpasang sepanjang animasi tutup; aksi terakhir dipertahankan agar judul
  // dan teks sheet tidak berganti saat sedang menutup.
  const [decision, setDecision] = useState<ReviewDecision>('approved');
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const setFeedback = (next: Omit<Feedback, 'id'>) =>
    setFeedbackState((prev) => ({ ...next, id: (prev?.id ?? 0) + 1 }));

  const reviewable = isReviewable(izin?.status);

  // Izin diputuskan dari luar (asisten lain) selagi sheet terbuka: aksi di sheet sudah tidak
  // berlaku, jadi sheet ditutup dan asisten diberi tahu. Selama aksi sendiri menunggu,
  // perubahan status berasal dari aksi itu dan hasilnya dibaca dari Result.
  useEffect(() => {
    if (!sheetOpen || pending || reviewable) return;
    setSheetOpen(false);
    setFeedbackState((prev) => ({
      tone: 'info',
      message: IZIN_ALREADY_REVIEWED_MESSAGE,
      id: (prev?.id ?? 0) + 1,
    }));
  }, [sheetOpen, pending, reviewable]);

  if (!izin) {
    // Deep link bisa tiba sebelum listener izin terisi; jangan langsung menyatakan tidak ditemukan.
    const loading = izinSync === 'idle' || izinSync === 'loading';
    return (
      <View style={styles.container}>
        <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToList} />
        <Screen edges={['left', 'right', 'bottom']}>
          {loading ? (
            <LoadingState />
          ) : izinSync === 'error' ? (
            // Listener gagal: izinnya mungkin ada, jadi jangan menyatakan tidak ditemukan.
            <View style={styles.body}>
              <Banner tone="danger" message="Gagal memuat data. Periksa koneksi lalu coba lagi." />
              <Button label="Kembali" onPress={goBackToList} variant="secondary" />
            </View>
          ) : (
            <EmptyState
              title="Izin tidak ditemukan"
              message="Izin mungkin sudah dihapus atau tautan tidak valid."
              action={{ label: 'Kembali', onPress: goBackToList }}
            />
          )}
        </Screen>
      </View>
    );
  }

  const praktikanName = getPraktikanName(izin.userName);
  const sessionLabel = getIzinSessionLabel(session ?? undefined, sessionsLoading);
  const review = izin.review;
  const catatan = review?.catatan?.trim();
  // pending_ai tanpa hasil = analisis belum selesai. Izin lama bisa saja pending_ai tetapi
  // sudah memuat ai; hasil itu tetap ditampilkan.
  const awaitingAi = !izin.ai && izin.status === 'pending_ai';
  const aiSaran = izin.ai?.state === 'success' ? izin.ai.saran : undefined;

  const handleRunAi = async () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);
    const res = await retryAi(izin.id);
    retryingRef.current = false;
    setRetrying(false);
    // Hasil sukses sudah terlihat di kartu lewat listener; hanya kegagalan tulis yang diumumkan.
    if (!res.ok) setFeedback({ tone: 'danger', message: writeErrorMessage(res.code) });
  };

  const openSheet = (next: ReviewDecision) => {
    setDecision(next);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    if (pendingRef.current) return;
    setSheetOpen(false);
  };

  const handleConfirm = async (note: string) => {
    if (pendingRef.current) return;
    // Pra-cek dari store: status akhir tidak dapat diubah (SRS §3.3). Di mode tanpa Firebase
    // tidak ada rules yang menolak, jadi tanpa pra-cek ini keputusan lama bisa tertimpa.
    if (!isReviewable(latestIzinStatus(izin.id))) {
      setSheetOpen(false);
      setFeedback({ tone: 'info', message: IZIN_ALREADY_REVIEWED_MESSAGE });
      return;
    }
    const action = decision;
    pendingRef.current = true;
    setPending(true);

    const res = await reviewIzin(izin.id, action, note || undefined);

    pendingRef.current = false;
    setPending(false);
    setSheetOpen(false);
    if (res.ok) {
      setFeedback({ tone: 'success', message: SUCCESS_MESSAGE[action] });
      return;
    }
    const decidedElsewhere = !isReviewable(latestIzinStatus(izin.id));
    setFeedback(
      decidedElsewhere || res.code === 'CONFLICT'
        ? { tone: 'info', message: IZIN_ALREADY_REVIEWED_MESSAGE }
        : { tone: 'danger', message: izinReviewErrorMessage(res.code) },
    );
  };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.body}>
          {feedback ? <Banner key={feedback.id} tone={feedback.tone} message={feedback.message} /> : null}

          <View style={styles.header}>
            <Text role="heading" style={styles.name}>
              {praktikanName}
            </Text>
            <Text style={styles.session}>{sessionLabel}</Text>
            <IzinStatusBadge status={izin.status} />
          </View>

          <Card>
            <View style={styles.fields}>
              <DetailField label="Diajukan" value={formatDateTime(izin.createdAt)} />
              <DetailField label="Alasan" value={izin.alasan} />
            </View>
          </Card>

          {/* Saran AI hanya relevan selama izin belum diputuskan atau bila hasilnya tersimpan. */}
          {reviewable || izin.ai ? (
            <View style={styles.actionGroup}>
              <AiSuggestionCard
                ai={izin.ai}
                onRetry={reviewable ? handleRunAi : undefined}
                retrying={retrying}
                retryDisabled={!isOnline}
              />
              {awaitingAi ? (
                // SRS §3.3: bila aplikasi praktikan tertutup sebelum AI selesai, asisten dapat
                // menjalankan AI dari sisinya. Kartu memuat tidak punya tombol (props SRS §8).
                <>
                  <Text style={styles.caption}>
                    Analisis biasanya berjalan otomatis di aplikasi praktikan. Bila status tidak
                    berubah, jalankan dari perangkat ini.
                  </Text>
                  <Button
                    label="Jalankan analisis AI"
                    variant="secondary"
                    onPress={handleRunAi}
                    loading={retrying}
                    disabled={!isOnline}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {reviewable ? (
            // Asisten tetap dapat memutuskan walau AI belum selesai atau gagal (SRS §3.3, rules).
            <View style={styles.actionGroup}>
              <View style={styles.actionRow}>
                <Button
                  label="Tolak"
                  variant="danger"
                  disabled={!isOnline}
                  onPress={() => openSheet('rejected')}
                  accessibilityLabel={`Tolak izin ${praktikanName}`}
                  style={styles.actionButton}
                />
                <Button
                  label="Setujui"
                  disabled={!isOnline}
                  onPress={() => openSheet('approved')}
                  accessibilityLabel={`Setujui izin ${praktikanName}`}
                  style={styles.actionButton}
                />
              </View>
              {isOnline ? null : <Text style={styles.caption}>{OFFLINE_ACTION_HINT}</Text>}
            </View>
          ) : (
            <Card>
              <View style={styles.fields}>
                <Text role="heading" style={styles.sectionTitle}>
                  Keputusan asisten
                </Text>
                <DetailField label="Keputusan" value={getIzinStatusLabel(izin.status)} />
                {review?.reviewedAt ? (
                  <DetailField label="Diputuskan" value={formatDateTime(review.reviewedAt)} />
                ) : null}
                <DetailField label="Catatan asisten" value={catatan || 'Tanpa catatan.'} />
              </View>
            </Card>
          )}

          <IzinReviewSheet
            visible={sheetOpen}
            decision={decision}
            praktikanName={praktikanName}
            sessionLabel={sessionLabel}
            aiSaran={aiSaran}
            loading={pending}
            disabled={!isOnline}
            onConfirm={handleConfirm}
            onClose={closeSheet}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  session: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  fields: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
  },
  actionGroup: {
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: 0,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
