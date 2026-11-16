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
import { SyncErrorState } from '@/components/ui/SyncErrorState';
import { goBackToIzinList } from '@/features/asisten/goBackToList';
import {
  IZIN_ALREADY_REVIEWED_MESSAGE,
  izinReviewErrorMessage,
} from '@/features/asisten/izinErrorMessage';
import { izinFilterOf } from '@/features/asisten/izinFilterLabels';
import { IzinReviewSheet } from '@/features/asisten/IzinReviewSheet';
import type { ReviewDecision } from '@/features/asisten/IzinReviewSheet';
import {
  getIzinSessionLabel,
  getIzinSessionState,
  getPraktikanName,
} from '@/features/asisten/izinSessionLabel';
import { useSyncRetry } from '@/features/asisten/useSyncRetry';
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

// Detail izin bergantung pada listener izin, dan label sesinya pada listener sesi.
const IZIN_DETAIL_SYNC_KEYS = ['izin', 'sessions'] as const;

const ORPHANED_MESSAGE = 'Sesi untuk izin ini sudah dihapus, jadi izin tidak perlu diperiksa.';

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
  const syncRetry = useSyncRetry(IZIN_DETAIL_SYNC_KEYS);
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
  // Izin yatim: sesinya sudah dihapus. Izin tetap bisa dibuka, tetapi tidak diperiksa lagi
  // karena tidak ada sesi yang rekapnya terpengaruh.
  const orphaned = getIzinSessionState(session, sessionsSync) === 'deleted';
  const canAct = reviewable && !orphaned;

  // Izin diputuskan dari luar (asisten lain) atau sesinya dihapus selagi sheet terbuka: aksi
  // di sheet sudah tidak berlaku, jadi sheet ditutup dan asisten diberi tahu. Selama aksi
  // sendiri menunggu, perubahan status berasal dari aksi itu dan hasilnya dibaca dari Result.
  useEffect(() => {
    if (!sheetOpen || pending || canAct) return;
    setSheetOpen(false);
    setFeedbackState((prev) => ({
      tone: 'info',
      message: reviewable ? ORPHANED_MESSAGE : IZIN_ALREADY_REVIEWED_MESSAGE,
      id: (prev?.id ?? 0) + 1,
    }));
  }, [sheetOpen, pending, canAct, reviewable]);

  if (!izin) {
    // Deep link bisa tiba sebelum listener izin terisi; jangan langsung menyatakan tidak ditemukan.
    const loading = izinSync === 'idle' || izinSync === 'loading';
    return (
      <View style={styles.container}>
        <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToIzinList} />
        <Screen edges={['left', 'right', 'bottom']}>
          {loading ? (
            <LoadingState />
          ) : izinSync === 'error' ? (
            // Listener gagal: izinnya mungkin ada, jadi jangan menyatakan tidak ditemukan.
            <View style={styles.body}>
              <SyncErrorState
                message={syncRetry.message}
                onRetry={syncRetry.retry}
                retrying={syncRetry.retrying}
              />
              <Button label="Kembali" onPress={goBackToIzinList} variant="secondary" />
            </View>
          ) : (
            <EmptyState
              title="Izin tidak ditemukan"
              message="Izin mungkin sudah dihapus atau tautan tidak valid."
              action={{ label: 'Kembali', onPress: goBackToIzinList }}
            />
          )}
        </Screen>
      </View>
    );
  }

  const praktikanName = getPraktikanName(izin.userName);
  const sessionLabel = getIzinSessionLabel(session, sessionsSync);
  const review = izin.review;
  const catatan = review?.catatan?.trim();
  // Belum ada hasil AI pada izin yang masih bisa diperiksa: kartu menampilkan state memuat
  // dan asisten bisa menjalankan analisis. Izin yang sudah diputuskan atau yatim tanpa hasil
  // tidak menampilkan kartu, karena analisis tidak akan berjalan lagi.
  const needsAi = !izin.ai && canAct;
  const aiSaran = izin.ai?.state === 'success' ? izin.ai.saran : undefined;

  const handleRunAi = async () => {
    if (retryingRef.current) return;
    // Sama dengan pemeriksaan: saveAiResult selalu menulis pending_review, jadi tanpa pra-cek
    // keputusan yang baru tiba dari perangkat lain bisa tertimpa di mode tanpa Firebase.
    if (!isReviewable(latestIzinStatus(izin.id))) {
      setFeedback({ tone: 'info', message: IZIN_ALREADY_REVIEWED_MESSAGE });
      return;
    }
    retryingRef.current = true;
    setRetrying(true);
    const res = await retryAi(izin.id);
    retryingRef.current = false;
    setRetrying(false);
    // Hasil sukses sudah terlihat di kartu lewat listener; hanya kegagalan tulis yang diumumkan.
    if (res.ok) return;
    const decidedElsewhere =
      res.code === 'PERMISSION_DENIED' && !isReviewable(latestIzinStatus(izin.id));
    setFeedback(
      decidedElsewhere
        ? { tone: 'info', message: IZIN_ALREADY_REVIEWED_MESSAGE }
        : { tone: 'danger', message: writeErrorMessage(res.code) },
    );
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
    if (!canAct) {
      setSheetOpen(false);
      setFeedback({ tone: 'info', message: ORPHANED_MESSAGE });
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
    // Firestore menulis ke cache lokal lebih dulu, jadi setelah TIMEOUT store sudah memuat
    // keputusan sendiri; status terbaru hanya bermakna "diputuskan pihak lain" bila rules
    // menolak. TIMEOUT dipetakan izinReviewErrorMessage ke pesan "belum dapat dipastikan".
    const decidedElsewhere =
      res.code === 'CONFLICT' ||
      (res.code === 'PERMISSION_DENIED' && !isReviewable(latestIzinStatus(izin.id)));
    setFeedback(
      decidedElsewhere
        ? { tone: 'info', message: IZIN_ALREADY_REVIEWED_MESSAGE }
        : { tone: 'danger', message: izinReviewErrorMessage(res.code) },
    );
  };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToIzinList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.body}>
          {feedback ? <Banner key={feedback.id} tone={feedback.tone} message={feedback.message} /> : null}

          <View style={styles.header}>
            <Text role="heading" style={styles.name}>
              {praktikanName}
            </Text>
            <Text style={[styles.session, orphaned && styles.sessionMissing]}>{sessionLabel}</Text>
            <IzinStatusBadge status={izin.status} />
          </View>

          {/* Data terakhir tetap tampil; versi ringkas mengingatkan bahwa isinya mungkin usang. */}
          {syncRetry.visible ? (
            <SyncErrorState
              compact
              message={syncRetry.message}
              onRetry={syncRetry.retry}
              retrying={syncRetry.retrying}
            />
          ) : null}

          <Card>
            <View style={styles.fields}>
              <DetailField label="Diajukan" value={formatDateTime(izin.createdAt)} />
              <DetailField label="Alasan" value={izin.alasan} />
            </View>
          </Card>

          {/* Saran AI tampil bila hasilnya tersimpan, atau selama izin masih bisa diperiksa. */}
          {izin.ai || needsAi ? (
            <View style={styles.actionGroup}>
              <AiSuggestionCard
                ai={izin.ai}
                onRetry={canAct ? handleRunAi : undefined}
                retrying={retrying}
                retryDisabled={!isOnline}
              />
              {needsAi ? (
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

          {reviewable && orphaned ? (
            <Text style={styles.caption}>{ORPHANED_MESSAGE}</Text>
          ) : reviewable ? (
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
  // Sudah textMuted; dimiringkan agar tidak terbaca sebagai nama sesi.
  sessionMissing: {
    fontStyle: 'italic',
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
