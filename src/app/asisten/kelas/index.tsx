import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { SyncErrorState } from '@/components/ui/SyncErrorState';
import { takeFlash } from '@/features/asisten/flash';
import { goBackToList } from '@/features/asisten/goBackToList';
import { KELAS_FLASH_SCOPE } from '@/features/asisten/kelasErrorMessage';
import { KelasRow } from '@/features/asisten/KelasRow';
import { useSyncRetry } from '@/features/asisten/useSyncRetry';
import { useKelasList, useSyncState } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { KelasPraktikum } from '@/types';

const KELAS_SYNC_KEYS = ['kelas'] as const;

function ListSeparator() {
  return <View style={styles.separator} />;
}

// Urutan stabil apa pun urutan dokumen kelasPraktikum dari listener: praktikum lalu kelas.
function byPraktikumThenKelas(a: KelasPraktikum, b: KelasPraktikum): number {
  return a.praktikum.localeCompare(b.praktikum, 'id') || a.kelas.localeCompare(b.kelas, 'id');
}

// id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar.
type Flash = { id: number; message: string };

const openCreate = () => router.push('/asisten/kelas/form');

export default function AsistenKelasListScreen() {
  const kelasList = useKelasList();
  const kelasSync = useSyncState('kelas');
  const kelasRetry = useSyncRetry(KELAS_SYNC_KEYS);
  const [flash, setFlashState] = useState<Flash | null>(null);

  // Pesan sukses dari form kelas, diambil saat layar ini kembali fokus setelah router.back().
  useFocusEffect(
    useCallback(() => {
      const message = takeFlash(KELAS_FLASH_SCOPE);
      if (message) setFlashState((prev) => ({ message, id: (prev?.id ?? 0) + 1 }));
    }, []),
  );

  const sortedKelas = useMemo(() => [...kelasList].sort(byPraktikumThenKelas), [kelasList]);

  // 'idle' berarti listener belum dipasang. Data terakhir tetap tampil saat offline (FR-29),
  // jadi status muat hanya menggantikan daftar yang masih kosong.
  const loadingInitial =
    (kelasSync === 'idle' || kelasSync === 'loading') && kelasList.length === 0;
  const syncError = kelasRetry.visible;

  return (
    <View style={styles.container}>
      <AppBar subtitle="Kelas praktikum" canGoBack onGoBack={goBackToList} />
      <Screen scroll={false} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={sortedKelas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KelasRow
              kelas={item}
              onPress={() =>
                router.push({ pathname: '/asisten/kelas/form', params: { id: item.id } })
              }
            />
          )}
          ItemSeparatorComponent={ListSeparator}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {flash ? <Banner key={flash.id} tone="success" message={flash.message} /> : null}
              <Button label="Tambah kelas" onPress={openCreate} />
              {syncError ? (
                <SyncErrorState
                  message={kelasRetry.message}
                  onRetry={kelasRetry.retry}
                  retrying={kelasRetry.retrying}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            syncError && kelasList.length === 0 ? null : loadingInitial ? (
              <LoadingState label="Memuat kelas praktikum…" />
            ) : (
              <EmptyState
                title="Belum ada kelas praktikum"
                message="Kelas praktikum dipakai saat membuat sesi dan saat praktikan mendaftar."
                action={{ label: 'Tambah kelas', onPress: openCreate }}
              />
            )
          }
        />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
});
