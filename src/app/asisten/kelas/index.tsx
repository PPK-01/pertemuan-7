import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { goBackToList } from '@/features/asisten/goBackToList';
import { KelasRow } from '@/features/asisten/KelasRow';
import { useKelasList, useSyncState } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { KelasPraktikum } from '@/types';

function ListSeparator() {
  return <View style={styles.separator} />;
}

// Urutan stabil apa pun urutan dokumen kelasPraktikum dari listener: praktikum lalu kelas.
function byPraktikumThenKelas(a: KelasPraktikum, b: KelasPraktikum): number {
  return a.praktikum.localeCompare(b.praktikum, 'id') || a.kelas.localeCompare(b.kelas, 'id');
}

export default function AsistenKelasListScreen() {
  const kelasList = useKelasList();
  const kelasSync = useSyncState('kelas');

  const sortedKelas = useMemo(() => [...kelasList].sort(byPraktikumThenKelas), [kelasList]);

  // 'idle' berarti listener belum dipasang. Data terakhir tetap tampil saat offline (FR-29),
  // jadi status muat hanya menggantikan daftar yang masih kosong.
  const loadingInitial =
    (kelasSync === 'idle' || kelasSync === 'loading') && kelasList.length === 0;
  const syncError = kelasSync === 'error';

  return (
    <View style={styles.container}>
      <AppBar subtitle="Kelas praktikum" canGoBack onGoBack={goBackToList} />
      <Screen scroll={false} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={sortedKelas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <KelasRow kelas={item} />}
          ItemSeparatorComponent={ListSeparator}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            syncError ? (
              <View style={styles.headerBlock}>
                <Banner tone="danger" message="Gagal memuat data. Periksa koneksi lalu coba lagi." />
              </View>
            ) : null
          }
          ListEmptyComponent={
            loadingInitial ? (
              <LoadingState label="Memuat kelas praktikum…" />
            ) : syncError ? null : (
              <EmptyState
                title="Belum ada kelas praktikum"
                message="Kelas praktikum dipakai saat membuat sesi dan saat praktikan mendaftar."
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
