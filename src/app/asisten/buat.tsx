import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SyncErrorState } from '@/components/ui/SyncErrorState';
import { SessionForm } from '@/features/asisten/SessionForm';
import type { LockableField, SessionFormFeedback } from '@/features/asisten/SessionForm';
import { STATUS_CHANGED_MESSAGE, sessionErrorMessage } from '@/features/asisten/sessionErrorMessage';
import { setSessionFlash } from '@/features/asisten/sessionFlash';
import { sessionToFormValues } from '@/features/asisten/sessionFormValidation';
import type { SessionFormInput } from '@/features/asisten/sessionFormValidation';
import { useSyncRetry } from '@/features/asisten/useSyncRetry';
import { OFFLINE_ACTION_HINT } from '@/features/asisten/writeErrorMessage';
import {
  useAppStore,
  useCurrentUser,
  useIsOnline,
  useSessionById,
  useSyncState,
} from '@/store/appStore';
import { spacing } from '@/theme/spacing';
import type { Session } from '@/types';

// FR-18 dan changedOnly di firestore.rules: sesi Dibuka hanya boleh mengubah topik, ruang,
// dan jam selesai. Kolom lain tetap tampil tetapi dikunci.
const OPEN_LOCKED_FIELDS: readonly LockableField[] = ['praktikum', 'kelas', 'tanggal', 'jamMulai'];
const OPEN_LOCKED_HINT = 'Tidak bisa diubah saat sesi dibuka.';
const UPDATE_SUCCESS_MESSAGE = 'Perubahan sesi disimpan.';

const SESSIONS_SYNC_KEYS = ['sessions'] as const;

const goToList = () => router.replace('/asisten');

function patchFor(status: Session['status'], input: SessionFormInput): Partial<Session> {
  if (status === 'open') {
    return { topik: input.topik, ruang: input.ruang, endAt: input.endAt };
  }
  return input;
}

export default function AsistenBuatSesiScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editId = Array.isArray(params.id) ? params.id[0] : params.id;

  const currentUser = useCurrentUser();
  const isOnline = useIsOnline();
  const session = useSessionById(editId ?? '');
  const sessionsSync = useSyncState('sessions');
  const sessionsRetry = useSyncRetry(SESSIONS_SYNC_KEYS);
  const createSession = useAppStore((state) => state.createSession);
  const updateSession = useAppStore((state) => state.updateSession);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SessionFormFeedback | null>(null);
  // State baru berlaku di render berikutnya; ref menahan tekanan beruntun sebelum itu.
  const submittingRef = useRef(false);
  // Status saat form ubah pertama tampil; bila berubah dari luar, form dimuat ulang dan diberi tahu.
  const [initialStatus] = useState(session?.status ?? null);

  const isEdit = editId !== undefined;
  const screenTitle = isEdit ? 'Ubah sesi' : 'Buat sesi';
  const goBack = () => (router.canGoBack() ? router.back() : goToList());

  const showError = (message: string) =>
    setSubmitError((prev) => ({ id: (prev?.id ?? 0) + 1, message }));

  async function handleCreate(input: SessionFormInput) {
    // Guard di asisten/_layout.tsx menjamin currentUser asisten terisi.
    if (submittingRef.current || !currentUser) return;
    submittingRef.current = true;
    setSubmitting(true);

    const res = await createSession({ ...input, createdBy: currentUser.id });
    if (res.ok) {
      // replace, bukan push: back dari detail kembali ke daftar, bukan ke form.
      // Ref tetap terkunci karena layar ini segera diganti.
      router.replace({ pathname: '/asisten/sesi/[id]', params: { id: res.data.id } });
      return;
    }

    // Isi form tetap di SessionForm; asisten cukup menekan tombol lagi.
    submittingRef.current = false;
    setSubmitting(false);
    showError(sessionErrorMessage(res.code, 'create'));
  }

  async function handleUpdate(target: Session, input: SessionFormInput) {
    if (submittingRef.current) return;
    if (target.status === 'closed') {
      showError(STATUS_CHANGED_MESSAGE);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);

    const res = await updateSession(target.id, patchFor(target.status, input));
    if (res.ok) {
      setSessionFlash(target.id, UPDATE_SUCCESS_MESSAGE);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({ pathname: '/asisten/sesi/[id]', params: { id: target.id } });
      }
      return;
    }

    submittingRef.current = false;
    setSubmitting(false);
    showError(sessionErrorMessage(res.code, 'update'));
  }

  const disabledHint = isOnline ? undefined : OFFLINE_ACTION_HINT;

  let body;
  if (!isEdit) {
    body = (
      <SessionForm
        onSubmit={handleCreate}
        onManageKelas={() => router.push('/asisten/kelas')}
        submitting={submitting}
        submitError={submitError}
        disabledHint={disabledHint}
      />
    );
  } else if (!session && sessionsSync === 'loading') {
    // Refresh atau deep link: daftar sesi belum termuat, belum tentu sesinya tidak ada.
    body = <LoadingState label="Memuat sesi…" />;
  } else if (!session && sessionsRetry.visible) {
    // Listener gagal: sesinya mungkin ada, jadi jangan menyatakan tidak ditemukan.
    body = (
      <SyncErrorState
        message={sessionsRetry.message}
        onRetry={sessionsRetry.retry}
        retrying={sessionsRetry.retrying}
      />
    );
  } else if (!session) {
    body = (
      <EmptyState
        title="Sesi tidak ditemukan"
        message="Sesi mungkin sudah dihapus atau tautan tidak valid."
        action={{ label: 'Kembali ke daftar sesi', onPress: goToList }}
      />
    );
  } else if (session.status === 'closed') {
    body = (
      <EmptyState
        title="Sesi sudah ditutup"
        message="Sesi yang sudah ditutup tidak bisa diubah."
        action={{ label: 'Kembali', onPress: goBack }}
      />
    );
  } else {
    const locked = session.status === 'open' ? OPEN_LOCKED_FIELDS : [];
    body = (
      <View style={styles.editContent}>
        {initialStatus !== null && session.status !== initialStatus ? (
          <Banner
            tone="info"
            message="Status sesi sudah berubah. Form dimuat ulang sesuai status terbaru."
          />
        ) : null}
        {/* key: perubahan status dari luar memuat ulang isian dan kolom yang dikunci. */}
        <SessionForm
          key={session.status}
          initialValues={sessionToFormValues(session)}
          lockedFields={locked}
          lockedHint={OPEN_LOCKED_HINT}
          onSubmit={(input) => handleUpdate(session, input)}
          submitLabel="Simpan perubahan"
          submitting={submitting}
          submitError={submitError}
          disabledHint={disabledHint}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar subtitle={screenTitle} canGoBack onGoBack={goBack} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.content}>{body}</View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.md,
  },
  editContent: {
    gap: spacing.md,
  },
});
