import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { IzinRow } from '@/components/izin/IzinRow';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { goBackToList } from '@/features/asisten/goBackToList';
import {
  DEFAULT_IZIN_FILTER,
  IZIN_FILTER_LABEL,
  IZIN_FILTER_LIST,
  izinFilterOf,
} from '@/features/asisten/izinFilterLabels';
import type { IzinFilter } from '@/features/asisten/izinFilterLabels';
import { getIzinSessionLabel, getPraktikanName } from '@/features/asisten/izinSessionLabel';
import {
  useCurrentUser,
  useIzinForAsisten,
  useSessionsForUser,
  useSyncState,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Session } from '@/types';

function ListSeparator() {
  return <View style={styles.separator} />;
}

export default function AsistenIzinListScreen() {
  const currentUser = useCurrentUser();
  // Listener izin realtime (FR-25). Store sudah mengurutkan terbaru di atas, sesuai FR-25
  // untuk semua filter. Satu daftar penuh dipakai agar angka di setiap chip dihitung dari
  // data yang sama dengan isi daftar.
  const izinList = useIzinForAsisten();
  const izinSync = useSyncState('izin');
  const sessions = useSessionsForUser(currentUser?.id ?? '');
  const sessionsSync = useSyncState('sessions');
  const sessionsLoading = sessionsSync === 'idle' || sessionsSync === 'loading';

  const [filter, setFilter] = useState<IzinFilter>(DEFAULT_IZIN_FILTER);

  const counts = useMemo<Record<IzinFilter, number>>(() => {
    const acc: Record<IzinFilter, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      all: izinList.length,
    };
    for (const izin of izinList) acc[izinFilterOf(izin.status)] += 1;
    return acc;
  }, [izinList]);

  const filteredIzin = useMemo(
    () => (filter === 'all' ? izinList : izinList.filter((i) => izinFilterOf(i.status) === filter)),
    [izinList, filter],
  );

  const sessionById = useMemo(() => {
    const map = new Map<string, Session>();
    for (const session of sessions) map.set(session.id, session);
    return map;
  }, [sessions]);

  // 'idle' berarti listener belum dipasang. Data terakhir tetap tampil saat offline (FR-29),
  // jadi status muat hanya menggantikan daftar yang masih kosong.
  const loadingInitial = (izinSync === 'idle' || izinSync === 'loading') && izinList.length === 0;
  const syncError = izinSync === 'error';

  return (
    <View style={styles.container}>
      <AppBar subtitle="Izin" canGoBack onGoBack={goBackToList} />
      <Screen scroll={false} edges={['left', 'right', 'bottom']}>
        <FlatList
          data={filteredIzin}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IzinRow
              izin={item}
              praktikanName={getPraktikanName(item.userName)}
              sessionLabel={getIzinSessionLabel(sessionById.get(item.sessionId), sessionsLoading)}
            />
          )}
          ItemSeparatorComponent={ListSeparator}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View role="radiogroup" aria-label="Filter status izin" style={styles.chipRow}>
                {IZIN_FILTER_LIST.map((item) => (
                  <Chip
                    key={item}
                    // Angka ikut di label agar terbaca pembaca layar bersama nama filter.
                    label={`${IZIN_FILTER_LABEL[item]} (${counts[item]})`}
                    selected={filter === item}
                    onPress={() => setFilter(item)}
                  />
                ))}
              </View>

              {syncError ? (
                <Banner tone="danger" message="Gagal memuat data. Periksa koneksi lalu coba lagi." />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            loadingInitial ? (
              <LoadingState />
            ) : syncError ? null : (
              <EmptyState title="Belum ada pengajuan izin" />
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
    paddingBottom: spacing.lg,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});
