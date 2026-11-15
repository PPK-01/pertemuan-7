import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { IzinRow } from '@/components/izin/IzinRow';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { goBackToList } from '@/features/asisten/goBackToList';
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
  // Listener izin realtime (FR-25); store sudah mengurutkan terbaru di atas.
  const izinList = useIzinForAsisten();
  const izinSync = useSyncState('izin');
  const sessions = useSessionsForUser(currentUser?.id ?? '');
  const sessionsSync = useSyncState('sessions');
  const sessionsLoading = sessionsSync === 'idle' || sessionsSync === 'loading';

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
          data={izinList}
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
            syncError ? (
              <Banner
                tone="danger"
                message="Gagal memuat data. Periksa koneksi lalu coba lagi."
                style={styles.banner}
              />
            ) : null
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
  banner: {
    marginBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
});
