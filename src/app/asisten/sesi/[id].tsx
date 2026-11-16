import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SessionInfo } from '@/components/session/SessionInfo';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { DeleteSessionSheet } from '@/features/asisten/DeleteSessionSheet';
import { goBackToList } from '@/features/asisten/goBackToList';
import { RekapList } from '@/features/asisten/RekapList';
import {
  OFFLINE_ACTION_HINT,
  STATUS_CHANGED_MESSAGE,
  sessionErrorMessage,
} from '@/features/asisten/sessionErrorMessage';
import { SessionCodeCard } from '@/features/asisten/SessionCodeCard';
import { takeSessionFlash } from '@/features/asisten/sessionFlash';
import { StatusActionSheet } from '@/features/asisten/StatusActionSheet';
import type { StatusAction } from '@/features/asisten/StatusActionSheet';
import {
  useAppStore,
  useIsOnline,
  useIzinBySession,
  useRekap,
  useSessionById,
  useSyncState,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ErrorCode, SessionStatus } from '@/types';

// id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar.
type Feedback = { id: number; tone: 'success' | 'danger' | 'info'; message: string };

type SheetKind = StatusAction | 'delete';
// fromStatus: status saat sheet dibuka, untuk mendeteksi perubahan dari luar.
type SheetState = { kind: SheetKind; fromStatus: SessionStatus };

// Tombol "Kembali ke daftar sesi" selalu menuju daftar, apa pun riwayatnya (mis. dari detail
// izin); tombol kembali di AppBar tetap mengikuti riwayat lewat goBackToList.
const goToList = () => router.replace('/asisten');

// Bila rules menolak karena status sudah berubah sebelum listener sempat memperbarui store,
// Result-nya bukan CONFLICT. Status terbaru dibaca langsung dari store (bukan dari closure
// render) dan dibandingkan dengan status saat sheet dibuka.
function failureMessage(
  sessionId: string,
  fromStatus: SessionStatus,
  code: ErrorCode,
  action: 'status' | 'delete',
): string {
  const latest = useAppStore.getState().sessions.find((s) => s.id === sessionId);
  if (!latest || latest.status !== fromStatus) return STATUS_CHANGED_MESSAGE;
  return sessionErrorMessage(code, action);
}

const SUCCESS_MESSAGE: Record<StatusAction, string> = {
  open: 'Sesi dibuka',
  close: 'Sesi ditutup',
};

export default function AsistenDetailSesiScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const sessionId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const session = useSessionById(sessionId);
  const rekap = useRekap(sessionId);
  const izinList = useIzinBySession(sessionId);
  const isOnline = useIsOnline();
  const sessionsSync = useSyncState('sessions');
  const openSession = useAppStore((state) => state.openSession);
  const closeSession = useAppStore((state) => state.closeSession);
  const deleteSession = useAppStore((state) => state.deleteSession);

  const [sheet, setSheet] = useState<SheetState | null>(null);
  // Sheet tetap terpasang sepanjang animasi tutup; aksi terakhir dipertahankan agar judul
  // dan teks sheet tidak berganti saat sedang menutup.
  const [statusAction, setStatusAction] = useState<StatusAction>('open');
  // Aksi tulis dari sheet sedang menunggu Result; ref menahan tekanan beruntun sebelum render.
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const setFeedback = (next: Omit<Feedback, 'id'>) =>
    setFeedbackState((prev) => ({ ...next, id: (prev?.id ?? 0) + 1 }));

  const currentStatus = session?.status ?? null;

  // Pesan sukses dari form ubah sesi, diambil saat layar ini kembali fokus setelah router.back().
  useFocusEffect(
    useCallback(() => {
      const message = takeSessionFlash(sessionId);
      if (message) {
        setFeedbackState((prev) => ({ tone: 'success', message, id: (prev?.id ?? 0) + 1 }));
      }
    }, [sessionId]),
  );

  // Status berubah dari luar (asisten lain atau listener realtime) selagi sheet terbuka:
  // aksi yang ditawarkan sheet sudah tidak berlaku, jadi sheet ditutup dan asisten diberi tahu.
  // Selama aksi sendiri menunggu, perubahan status berasal dari aksi itu dan hasilnya dibaca
  // dari Result.
  useEffect(() => {
    if (sheet === null || pending || currentStatus === sheet.fromStatus) return;
    setSheet(null);
    setFeedbackState((prev) => ({
      tone: 'info',
      message: STATUS_CHANGED_MESSAGE,
      id: (prev?.id ?? 0) + 1,
    }));
  }, [currentStatus, sheet, pending]);

  if (!session) {
    return (
      <View style={styles.container}>
        <AppBar subtitle="Detail sesi" canGoBack onGoBack={goBackToList} />
        <Screen edges={['left', 'right', 'bottom']}>
          {pending ? (
            // Listener sudah membuang sesi yang sedang dihapus sebelum Result diterima.
            <LoadingState label="Menghapus sesi…" />
          ) : sessionsSync === 'loading' ? (
            // Refresh atau deep link: daftar sesi belum termuat, belum tentu sesinya tidak ada.
            <LoadingState label="Memuat sesi…" />
          ) : (
            <EmptyState
              title="Sesi tidak ditemukan"
              message="Sesi mungkin sudah dihapus atau tautan tidak valid."
              action={{ label: 'Kembali ke daftar sesi', onPress: goToList }}
            />
          )}
        </Screen>
      </View>
    );
  }

  const showSheet = (kind: SheetKind) => {
    if (kind !== 'delete') setStatusAction(kind);
    setSheet({ kind, fromStatus: session.status });
  };

  const closeSheet = () => {
    if (pendingRef.current) return;
    setSheet(null);
  };

  const handleStatusConfirm = async () => {
    if (pendingRef.current) return;
    const action = statusAction;
    const fromStatus = sheet?.fromStatus ?? session.status;
    pendingRef.current = true;
    setPending(true);

    const actionFn = action === 'open' ? openSession : closeSession;
    const res = await actionFn(session.id);

    pendingRef.current = false;
    setPending(false);
    setSheet(null);
    // Transisi yang sudah tidak berlaku datang sebagai CONFLICT dari pra-cek store, atau
    // ditolak rules sebelum store diperbarui; keduanya menjadi STATUS_CHANGED_MESSAGE.
    setFeedback(
      res.ok
        ? { tone: 'success', message: SUCCESS_MESSAGE[action] }
        : { tone: 'danger', message: failureMessage(session.id, fromStatus, res.code, 'status') },
    );
  };

  const handleDeleteConfirm = async () => {
    if (pendingRef.current) return;
    // FR-19 dan rules: hanya sesi Dijadwalkan yang boleh dihapus.
    if (session.status !== 'scheduled') {
      setSheet(null);
      setFeedback({ tone: 'danger', message: STATUS_CHANGED_MESSAGE });
      return;
    }
    pendingRef.current = true;
    setPending(true);

    const res = await deleteSession(session.id);
    if (res.ok) {
      // pending dibiarkan true agar layar menampilkan LoadingState sampai diganti daftar sesi.
      router.replace('/asisten');
      return;
    }

    pendingRef.current = false;
    setPending(false);
    setSheet(null);
    setFeedback({
      tone: 'danger',
      message: failureMessage(session.id, 'scheduled', res.code, 'delete'),
    });
  };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail sesi" canGoBack onGoBack={goBackToList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.page}>
          {feedback ? <Banner key={feedback.id} tone={feedback.tone} message={feedback.message} /> : null}

          <Card>
            <SessionInfo session={session} />
          </Card>

          {session.status !== 'closed' ? (
            <Button
              label="Ubah"
              variant="secondary"
              accessibilityLabel="Ubah sesi"
              onPress={() =>
                router.push({ pathname: '/asisten/buat', params: { id: session.id } })
              }
            />
          ) : null}

          {session.status === 'open' ? (
            <SessionCodeCard sessionId={session.id} kelas={session.kelas} />
          ) : null}

          {session.status === 'closed' ? (
            feedback ? null : <Banner tone="info" message="Sesi sudah ditutup." />
          ) : (
            <View style={styles.actionGroup}>
              {session.status === 'scheduled' ? (
                <Button label="Buka sesi" disabled={!isOnline} onPress={() => showSheet('open')} />
              ) : (
                <Button
                  label="Tutup sesi"
                  variant="danger"
                  disabled={!isOnline}
                  onPress={() => showSheet('close')}
                />
              )}
              {isOnline ? null : <Text style={styles.actionHint}>{OFFLINE_ACTION_HINT}</Text>}
            </View>
          )}

          <View style={styles.section}>
            <Text role="heading" style={styles.sectionTitle}>
              Rekap kehadiran
            </Text>
            {session.status === 'scheduled' ? (
              <Text style={styles.sectionHint}>Rekap muncul setelah sesi dibuka.</Text>
            ) : rekap ? (
              <RekapList rekap={rekap} />
            ) : null}
          </View>

          {/* FR-19: sesi yang pernah dibuka adalah arsip rekap, jadi hanya Dijadwalkan yang bisa dihapus. */}
          {session.status === 'scheduled' ? (
            <View style={styles.actionGroup}>
              <Button
                label="Hapus sesi"
                variant="danger"
                disabled={!isOnline}
                onPress={() => showSheet('delete')}
              />
              {isOnline ? null : <Text style={styles.actionHint}>{OFFLINE_ACTION_HINT}</Text>}
            </View>
          ) : null}

          <StatusActionSheet
            visible={sheet?.kind === 'open' || sheet?.kind === 'close'}
            action={statusAction}
            kelas={session.kelas}
            loading={pending}
            disabled={!isOnline}
            onConfirm={handleStatusConfirm}
            onClose={closeSheet}
          />
          <DeleteSessionSheet
            visible={sheet?.kind === 'delete'}
            session={session}
            izinCount={izinList.length}
            loading={pending}
            disabled={!isOnline}
            onConfirm={handleDeleteConfirm}
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
  },
  page: {
    gap: spacing.xl,
    paddingVertical: spacing.md,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionHint: {
    ...typography.body,
    color: colors.textMuted,
  },
  actionGroup: {
    gap: spacing.sm,
  },
  actionHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
