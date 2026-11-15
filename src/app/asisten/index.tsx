import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdentityCard } from '@/components/ui/IdentityCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { Screen } from '@/components/ui/Screen';
import { Tile } from '@/components/ui/Tile';
import {
  SESSION_FILTER_EMPTY,
  SESSION_FILTER_LABEL,
  SESSION_FILTER_LIST,
  SHOW_ALL_SESSIONS_LABEL,
} from '@/features/asisten/sessionFilterLabels';
import type { SessionFilter } from '@/features/asisten/sessionFilterLabels';
import { IzinShortcut } from '@/features/asisten/IzinShortcut';
import { KeluarSheet } from '@/features/asisten/KeluarSheet';
import { SessionListItem } from '@/features/asisten/SessionListItem';
import {
  useAppStore,
  useCurrentUser,
  useIzinForAsisten,
  useSessionsForUser,
  useSyncState,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function PlusIcon() {
  return (
    <View style={styles.plusBox}>
      <View style={styles.plusHorizontal} />
      <View style={styles.plusVertical} />
    </View>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
}

export default function AsistenHomeScreen() {
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();
  const logout = useAppStore((state) => state.logout);
  const sessions = useSessionsForUser(currentUser?.id ?? '');
  const sessionsSync = useSyncState('sessions');
  const izinList = useIzinForAsisten();
  const izinSync = useSyncState('izin');

  const [filter, setFilter] = useState<SessionFilter>('all');
  const [keluarVisible, setKeluarVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [keluarError, setKeluarError] = useState<string | null>(null);

  const counts = useMemo<Record<SessionFilter, number>>(() => {
    const acc: Record<SessionFilter, number> = {
      all: sessions.length,
      scheduled: 0,
      open: 0,
      closed: 0,
    };
    for (const session of sessions) {
      acc[session.status] = (acc[session.status] ?? 0) + 1;
    }
    return acc;
  }, [sessions]);

  // FR-25: "Perlu diperiksa" mencakup pending_ai dan pending_review.
  const pendingIzinCount = useMemo(
    () =>
      izinList.filter((i) => i.status === 'pending_ai' || i.status === 'pending_review').length,
    [izinList],
  );

  const filteredSessions = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter((s) => s.status === filter)),
    [sessions, filter],
  );

  const openCreate = () => router.push('/asisten/buat');

  // Navigasi ke layar Masuk diserahkan ke gate rute: logout() mengosongkan currentUser,
  // lalu root layout mengganti rute ke (auth)/login (guard asisten ikut mengalihkan ke /).
  const confirmKeluar = async () => {
    setKeluarError(null);
    setLoggingOut(true);
    try {
      await logout();
      setKeluarVisible(false);
    } catch {
      // Sheet tetap terbuka agar pengguna tahu masih masuk dan bisa mencoba lagi.
      setKeluarError('Gagal keluar. Coba lagi.');
    } finally {
      setLoggingOut(false);
    }
  };

  const closeKeluar = () => {
    setKeluarVisible(false);
    setKeluarError(null);
  };

  // 'idle' berarti listener belum dipasang. Data yang sudah ada tetap ditampilkan (FR-29),
  // jadi status muat hanya menggantikan daftar yang masih kosong.
  const loadingInitial =
    (sessionsSync === 'idle' || sessionsSync === 'loading') && sessions.length === 0;
  const syncError = sessionsSync === 'error';

  const empty = SESSION_FILTER_EMPTY[filter];
  const emptyMessage = 'message' in empty ? empty.message : undefined;
  const emptyAction =
    filter === 'all'
      ? { label: 'Buat sesi', onPress: openCreate }
      : { label: SHOW_ALL_SESSIONS_LABEL, onPress: () => setFilter('all') };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Sesi" />

      <Screen scroll={false} edges={['left', 'right']}>
        <View style={styles.screenInner}>
          <FlatList
            data={filteredSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SessionListItem session={item} />}
            ItemSeparatorComponent={ListSeparator}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                {currentUser ? (
                  <IdentityCard
                    name={currentUser.name}
                    keyInfo="Asisten"
                    supportingInfo="Laboratorium Komputer"
                    actionLabel="Keluar"
                    onAction={() => setKeluarVisible(true)}
                  />
                ) : null}

                <IzinShortcut
                  pendingCount={pendingIzinCount}
                  countStatus={
                    izinSync === 'error' ? 'error' : izinSync === 'ready' ? 'ready' : 'loading'
                  }
                  onPress={() => router.push('/asisten/izin')}
                />

                <View
                  role="radiogroup"
                  aria-label="Filter status sesi"
                  style={styles.tilesGrid}
                >
                  {SESSION_FILTER_LIST.map((item) => (
                    <Tile
                      key={item}
                      label={SESSION_FILTER_LABEL[item]}
                      count={counts[item]}
                      iconType={item}
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
              ) : syncError && sessions.length === 0 ? null : (
                <EmptyState title={empty.title} message={emptyMessage} action={emptyAction} />
              )
            }
          />
        </View>
      </Screen>

      {/* Bar bawah polos dengan tombol bulat tengah "Buat sesi" */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
        <Pressable
          onPress={openCreate}
          role="button"
          aria-label="Buat sesi"
          style={({ pressed }) => [
            styles.centerButtonWrapper,
            pressed && { opacity: PRESSED_OPACITY },
          ]}
        >
          <View style={styles.centerButtonCircle}>
            <PlusIcon />
          </View>
          <Text style={styles.centerButtonLabel}>Buat sesi</Text>
        </Pressable>
      </View>

      <KeluarSheet
        visible={keluarVisible}
        loading={loggingOut}
        errorMessage={keluarError}
        onClose={closeKeluar}
        onConfirm={confirmKeluar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenInner: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl + 40,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  tilesGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    minHeight: layout.minTouch,
    minWidth: layout.minTouch,
  },
  centerButtonCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    borderWidth: 3.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonLabel: {
    fontSize: typography.caption.fontSize,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  plusBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    width: 14,
    height: 2.5,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  plusVertical: {
    position: 'absolute',
    width: 2.5,
    height: 14,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
});
