import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/AppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdentityCard } from '@/components/ui/IdentityCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { Screen } from '@/components/ui/Screen';
import { SyncErrorState } from '@/components/ui/SyncErrorState';
import { Tile } from '@/components/ui/Tile';
import {
  SESSION_FILTER_EMPTY,
  SESSION_FILTER_LABEL,
  SESSION_FILTER_LIST,
  SHOW_ALL_SESSIONS_LABEL,
} from '@/features/asisten/sessionFilterLabels';
import type { SessionFilter } from '@/features/asisten/sessionFilterLabels';
import { IzinShortcut } from '@/features/asisten/IzinShortcut';
import { KelasShortcut } from '@/features/asisten/KelasShortcut';
import { KeluarSheet } from '@/features/asisten/KeluarSheet';
import { SessionListItem } from '@/features/asisten/SessionListItem';
import { useSyncRetry } from '@/features/asisten/useSyncRetry';
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

// Ukuran tombol bulat "Buat sesi" di bar bawah; tidak ada padanan token.
const CENTER_BUTTON_SIZE = 54;
// Seberapa jauh tombol bulat menonjol ke atas bar bawah.
const CENTER_BUTTON_LIFT = 24;
// Cincin warna surface yang memisahkan tombol bulat dari daftar di belakangnya.
const CENTER_BUTTON_RING = 3.5;
// Label tombol bulat lebih rapat dari typography.caption agar muat di bar bawah.
const CENTER_LABEL_LINE_HEIGHT = 14;
// Jarak label ke lingkaran; spacing.xs (4) terlalu renggang untuk bar bawah.
const CENTER_LABEL_GAP = 2;
// Lebar dasar tiap pintasan: dua pintasan berdampingan bila muat, bertumpuk di layar 360dp
// agar keterangan "Perlu diperiksa" tidak terlipat.
const SHORTCUT_BASIS = 200;
// Garis pemisah bar bawah setebal 1 seperti border komponen lain, bukan hairline.
const BAR_BORDER_WIDTH = 1;
// Ikon plus digambar dari dua garis: kotak 20, garis 14 x 2,5 agar seimbang di lingkaran 54.
const PLUS_ICON_SIZE = 20;
const PLUS_STROKE_LENGTH = 14;
const PLUS_STROKE_WIDTH = 2.5;

const SESSIONS_SYNC_KEYS = ['sessions'] as const;
// Badge pintasan Izin bergantung pada listener izin.
const IZIN_SYNC_KEYS = ['izin'] as const;

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
  const sessionsRetry = useSyncRetry(SESSIONS_SYNC_KEYS);
  const izinList = useIzinForAsisten();
  const izinSync = useSyncState('izin');
  const izinRetry = useSyncRetry(IZIN_SYNC_KEYS);

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
    const res = await logout();
    setLoggingOut(false);
    if (res.ok) {
      setKeluarVisible(false);
      return;
    }
    // Sheet tetap terbuka agar pengguna tahu masih masuk dan bisa mencoba lagi.
    setKeluarError('Gagal keluar. Coba lagi.');
  };

  const closeKeluar = () => {
    setKeluarVisible(false);
    setKeluarError(null);
  };

  // 'idle' berarti listener belum dipasang. Data yang sudah ada tetap ditampilkan (FR-29),
  // jadi status muat hanya menggantikan daftar yang masih kosong.
  const loadingInitial =
    (sessionsSync === 'idle' || sessionsSync === 'loading') && sessions.length === 0;
  const syncError = sessionsRetry.visible;

  const empty = SESSION_FILTER_EMPTY[filter];
  const emptyMessage = 'message' in empty ? empty.message : undefined;
  const emptyAction =
    filter === 'all'
      ? { label: 'Buat sesi', onPress: openCreate }
      : { label: SHOW_ALL_SESSIONS_LABEL, onPress: () => setFilter('all') };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Sesi" />

      <Screen scroll={false} edges={['left', 'right']} noPadding>
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

                <View style={styles.shortcutRow}>
                  <View style={styles.shortcutItem}>
                    <IzinShortcut
                      pendingCount={pendingIzinCount}
                      countStatus={
                        izinSync === 'error' ? 'error' : izinSync === 'ready' ? 'ready' : 'loading'
                      }
                      onPress={() => router.push('/asisten/izin')}
                    />
                  </View>
                  <View style={styles.shortcutItem}>
                    <KelasShortcut onPress={() => router.push('/asisten/kelas')} />
                  </View>
                </View>

                {izinRetry.visible ? (
                  <SyncErrorState
                    compact
                    message={izinRetry.message}
                    onRetry={izinRetry.retry}
                    retrying={izinRetry.retrying}
                  />
                ) : null}

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
                  <SyncErrorState
                    message={sessionsRetry.message}
                    onRetry={sessionsRetry.retry}
                    retrying={sessionsRetry.retrying}
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              syncError && sessions.length === 0 ? undefined : loadingInitial ? (
                <LoadingState />
              ) : (
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    // Ruang tambahan agar item terakhir tidak tertutup tombol bulat yang menonjol.
    paddingBottom: spacing.xxl + CENTER_BUTTON_LIFT + spacing.lg,
  },
  headerBlock: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shortcutItem: {
    flexGrow: 1,
    flexBasis: SHORTCUT_BASIS,
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
    borderTopWidth: BAR_BORDER_WIDTH,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -CENTER_BUTTON_LIFT,
    minHeight: layout.minTouch,
    minWidth: layout.minTouch,
  },
  centerButtonCircle: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: CENTER_BUTTON_RING,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonLabel: {
    fontSize: typography.caption.fontSize,
    lineHeight: CENTER_LABEL_LINE_HEIGHT,
    fontWeight: typography.label.fontWeight,
    color: colors.primary,
    marginTop: CENTER_LABEL_GAP,
  },
  plusBox: {
    width: PLUS_ICON_SIZE,
    height: PLUS_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    width: PLUS_STROKE_LENGTH,
    height: PLUS_STROKE_WIDTH,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  plusVertical: {
    position: 'absolute',
    width: PLUS_STROKE_WIDTH,
    height: PLUS_STROKE_LENGTH,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
});
