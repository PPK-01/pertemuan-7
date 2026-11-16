import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SyncErrorState } from '@/components/ui/SyncErrorState';
import { DeleteKelasSheet } from '@/features/asisten/DeleteKelasSheet';
import { setFlash } from '@/features/asisten/flash';
import { KELAS_FLASH_SCOPE, kelasErrorMessage } from '@/features/asisten/kelasErrorMessage';
import type { KelasAction } from '@/features/asisten/kelasErrorMessage';
import { KelasForm } from '@/features/asisten/KelasForm';
import type { KelasFormFeedback } from '@/features/asisten/KelasForm';
import { validateKelasForm } from '@/features/asisten/kelasValidation';
import type { KelasFormInput } from '@/features/asisten/kelasValidation';
import { useSyncRetry } from '@/features/asisten/useSyncRetry';
import { OFFLINE_ACTION_HINT } from '@/features/asisten/writeErrorMessage';
import { useAppStore, useIsOnline, useKelasList, useSyncState } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { ErrorCode, KelasPraktikum } from '@/types';

const CREATE_SUCCESS_MESSAGE = 'Kelas praktikum ditambahkan.';
const UPDATE_SUCCESS_MESSAGE = 'Perubahan kelas disimpan.';
const DELETE_SUCCESS_MESSAGE = 'Kelas praktikum dihapus.';

const KELAS_SYNC_KEYS = ['kelas'] as const;

const goToList = () => router.replace('/asisten/kelas');
const goBack = () => (router.canGoBack() ? router.back() : goToList());

// Result gagal dibaca bersama cache terbaru (bukan closure render): apakah pasangan lama masih
// dipakai sesi, dan apakah pasangan baru sudah ada, untuk membedakan arti CONFLICT.
function failureMessage(
  code: ErrorCode,
  action: KelasAction,
  original: Pick<KelasPraktikum, 'id' | 'praktikum' | 'kelas'> | null,
  input: KelasFormInput | null,
): string {
  const { sessions, kelasList } = useAppStore.getState();
  const inUse =
    original !== null &&
    sessions.some((s) => s.praktikum === original.praktikum && s.kelas === original.kelas);
  const duplicate = input !== null && !validateKelasForm(input, kelasList, original?.id).ok;
  return kelasErrorMessage(code, action, { inUse, duplicate });
}

export default function AsistenKelasFormScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEdit = editId !== undefined;

  const kelasList = useKelasList();
  const kelasSync = useSyncState('kelas');
  const kelasRetry = useSyncRetry(KELAS_SYNC_KEYS);
  const isOnline = useIsOnline();
  const addKelas = useAppStore((state) => state.addKelas);
  const updateKelas = useAppStore((state) => state.updateKelas);
  const deleteKelas = useAppStore((state) => state.deleteKelas);

  const target = isEdit ? (kelasList.find((item) => item.id === editId) ?? null) : null;

  const [submitting, setSubmitting] = useState(false);
  // State baru berlaku di render berikutnya; ref menahan tekanan beruntun sebelum itu.
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<KelasFormFeedback | null>(null);
  const showError = (message: string) =>
    setSubmitError((prev) => ({ id: (prev?.id ?? 0) + 1, message }));

  const [sheetOpen, setSheetOpen] = useState(false);
  // deleteKelas sedang menunggu Result; ref menahan tekanan beruntun sebelum render berikutnya.
  const [deleting, setDeleting] = useState(false);
  const deletingRef = useRef(false);
  const [deleteError, setDeleteError] = useState<KelasFormFeedback | null>(null);

  async function handleCreate(input: KelasFormInput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const res = await addKelas(input.praktikum, input.kelas);
    if (res.ok) {
      // Ref tetap terkunci karena layar ini segera ditinggalkan.
      setFlash(KELAS_FLASH_SCOPE, CREATE_SUCCESS_MESSAGE);
      goBack();
      return;
    }

    // Isi form tetap di KelasForm; asisten cukup menekan tombol lagi.
    submittingRef.current = false;
    setSubmitting(false);
    showError(failureMessage(res.code, 'create', null, input));
  }

  async function handleUpdate(original: KelasPraktikum, input: KelasFormInput) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    const res = await updateKelas(original.id, input.praktikum, input.kelas);
    if (res.ok) {
      setFlash(KELAS_FLASH_SCOPE, UPDATE_SUCCESS_MESSAGE);
      goBack();
      return;
    }

    submittingRef.current = false;
    setSubmitting(false);
    showError(failureMessage(res.code, 'update', original, input));
  }

  async function handleDelete(original: KelasPraktikum) {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeleting(true);

    const res = await deleteKelas(original.id);
    if (res.ok) {
      // deleting dibiarkan true agar layar menampilkan LoadingState sampai kembali ke daftar;
      // listener bisa membuang kelas ini lebih dulu daripada navigasi.
      setFlash(KELAS_FLASH_SCOPE, DELETE_SUCCESS_MESSAGE);
      goBack();
      return;
    }

    deletingRef.current = false;
    setDeleting(false);
    setSheetOpen(false);
    setDeleteError((prev) => ({
      id: (prev?.id ?? 0) + 1,
      message: failureMessage(res.code, 'delete', original, null),
    }));
  }

  const closeSheet = () => {
    if (deletingRef.current) return;
    setSheetOpen(false);
  };

  const disabledHint = isOnline ? undefined : OFFLINE_ACTION_HINT;

  let body;
  if (!isEdit) {
    body = (
      <KelasForm
        onSubmit={handleCreate}
        submitting={submitting}
        submitError={submitError}
        disabledHint={disabledHint}
      />
    );
  } else if (!target && deleting) {
    body = <LoadingState label="Menghapus kelas…" />;
  } else if (!target && (kelasSync === 'idle' || kelasSync === 'loading')) {
    // Refresh atau deep link: daftar kelas belum termuat, belum tentu kelasnya tidak ada.
    body = <LoadingState label="Memuat kelas…" />;
  } else if (!target && kelasRetry.visible) {
    // Listener gagal: kelasnya mungkin ada, jadi jangan menyatakan tidak ditemukan.
    body = (
      <SyncErrorState
        message={kelasRetry.message}
        onRetry={kelasRetry.retry}
        retrying={kelasRetry.retrying}
      />
    );
  } else if (!target) {
    body = (
      <EmptyState
        title="Kelas tidak ditemukan"
        message="Kelas mungkin sudah dihapus atau tautan tidak valid."
        action={{ label: 'Kembali ke daftar kelas', onPress: goToList }}
      />
    );
  } else {
    body = (
      <View style={styles.editContent}>
        <KelasForm
          initialValues={{ praktikum: target.praktikum, kelas: target.kelas }}
          editId={target.id}
          onSubmit={(input) => handleUpdate(target, input)}
          submitLabel="Simpan perubahan"
          submitting={submitting}
          submitError={submitError}
          disabledHint={disabledHint}
        />

        <View style={styles.deleteGroup}>
          {deleteError ? (
            <Banner key={deleteError.id} tone="danger" message={deleteError.message} />
          ) : null}
          <Button
            label="Hapus kelas"
            variant="danger"
            disabled={!isOnline || submitting}
            onPress={() => {
              setDeleteError(null);
              setSheetOpen(true);
            }}
          />
          {isOnline ? null : <Text style={styles.hint}>{OFFLINE_ACTION_HINT}</Text>}
        </View>

        <DeleteKelasSheet
          visible={sheetOpen}
          kelas={target}
          loading={deleting}
          disabled={!isOnline}
          onConfirm={() => handleDelete(target)}
          onClose={closeSheet}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar subtitle={isEdit ? 'Ubah kelas' : 'Tambah kelas'} canGoBack onGoBack={goBack} />
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
    gap: spacing.xxl,
  },
  deleteGroup: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
