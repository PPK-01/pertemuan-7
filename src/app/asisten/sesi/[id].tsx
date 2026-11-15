import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CodeDisplay } from '@/components/session/CodeDisplay';
import { SessionInfo } from '@/components/session/SessionInfo';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { RekapList } from '@/features/asisten/RekapList';
import { StatusActionSheet } from '@/features/asisten/StatusActionSheet';
import type { StatusAction } from '@/features/asisten/StatusActionSheet';
import { readStatusActionResult } from '@/features/asisten/statusActionResult';
import { useAppStore, useRekap, useSessionById } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { SessionStatus } from '@/types';

// id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar.
type Feedback = { id: number; tone: 'success' | 'danger' | 'info'; message: string };

const STATUS_CHANGED_MESSAGE = 'Status sesi sudah berubah. Tampilan sudah diperbarui.';

const SUCCESS_MESSAGE: Record<StatusAction, string> = {
  open: 'Sesi dibuka',
  close: 'Sesi ditutup',
};

export default function AsistenDetailSesiScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const sessionId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const session = useSessionById(sessionId);
  const rekap = useRekap(sessionId);
  const openSession = useAppStore((state) => state.openSession);
  const closeSession = useAppStore((state) => state.closeSession);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetAction, setSheetAction] = useState<StatusAction>('open');
  // Status saat sheet dibuka; null bila sheet tidak sedang menunggu konfirmasi.
  const [sheetFromStatus, setSheetFromStatus] = useState<SessionStatus | null>(null);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const setFeedback = (next: Omit<Feedback, 'id'>) =>
    setFeedbackState((prev) => ({ ...next, id: (prev?.id ?? 0) + 1 }));

  const currentStatus = session?.status ?? null;

  // Status berubah dari luar (asisten lain atau listener realtime) selagi sheet terbuka:
  // aksi yang ditawarkan sheet sudah tidak berlaku, jadi sheet ditutup dan asisten diberi tahu.
  useEffect(() => {
    if (sheetFromStatus === null || currentStatus === sheetFromStatus) return;
    setSheetVisible(false);
    setSheetFromStatus(null);
    setFeedback({ tone: 'info', message: STATUS_CHANGED_MESSAGE });
  }, [currentStatus, sheetFromStatus]);

  if (!session) {
    return (
      <View style={styles.container}>
        <AppBar subtitle="Detail sesi" canGoBack onGoBack={() => router.back()} />
        <Screen edges={['left', 'right', 'bottom']}>
          <EmptyState
            title="Sesi tidak ditemukan"
            message="Sesi mungkin sudah dihapus atau tautan tidak valid."
            action={{ label: 'Kembali ke daftar sesi', onPress: () => router.back() }}
          />
        </Screen>
      </View>
    );
  }

  const showSheet = (action: StatusAction) => {
    setSheetAction(action);
    setSheetFromStatus(session.status);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setSheetFromStatus(null);
  };

  const handleConfirm = async () => {
    const action = sheetAction;
    closeSheet();
    const actionFn = action === 'open' ? openSession : closeSession;
    const outcome = await readStatusActionResult(actionFn(session.id));
    if (outcome.kind === 'success') {
      setFeedback({ tone: 'success', message: SUCCESS_MESSAGE[action] });
    } else if (outcome.kind === 'stale') {
      setFeedback({ tone: 'info', message: STATUS_CHANGED_MESSAGE });
    } else {
      setFeedback({ tone: 'danger', message: outcome.message });
    }
  };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail sesi" canGoBack onGoBack={() => router.back()} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.page}>
          {feedback ? <Banner key={feedback.id} tone={feedback.tone} message={feedback.message} /> : null}

          <Card>
            <SessionInfo session={session} />
          </Card>

          {session.status === 'open' ? (
            <CodeDisplay
              code={session.code}
              hint="Bagikan kode ini ke kelas."
            />
          ) : null}

          {session.status === 'scheduled' ? (
            <Button label="Buka sesi" onPress={() => showSheet('open')} />
          ) : session.status === 'open' ? (
            <Button label="Tutup sesi" variant="danger" onPress={() => showSheet('close')} />
          ) : feedback ? null : (
            <Banner tone="info" message="Sesi sudah ditutup." />
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

          <StatusActionSheet
            visible={sheetVisible}
            action={sheetAction}
            kelas={session.kelas}
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
});
