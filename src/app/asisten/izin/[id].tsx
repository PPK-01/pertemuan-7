import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IzinStatusBadge } from '@/components/izin/IzinStatusBadge';
import { AppBar } from '@/components/ui/AppBar';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { goBackToList } from '@/features/asisten/goBackToList';
import { izinFilterOf } from '@/features/asisten/izinFilterLabels';
import { getIzinSessionLabel, getPraktikanName } from '@/features/asisten/izinSessionLabel';
import { useIzinById, useSessionById, useSyncState } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDateTime } from '@/utils/time';

// Detail baca-saja; tombol Setujui/Tolak dan kartu saran AI menyusul bersama pemeriksaan izin.
const REVIEW_PENDING_CAPTION = 'Pemeriksaan izin akan tersedia di pembaruan berikutnya.';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function AsistenDetailIzinScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const izinId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const izin = useIzinById(izinId);
  const izinSync = useSyncState('izin');
  const session = useSessionById(izin?.sessionId ?? '');
  const sessionsSync = useSyncState('sessions');
  const sessionsLoading = sessionsSync === 'idle' || sessionsSync === 'loading';

  if (!izin) {
    // Deep link bisa tiba sebelum listener izin terisi; jangan langsung menyatakan tidak ditemukan.
    const loading = izinSync === 'idle' || izinSync === 'loading';
    return (
      <View style={styles.container}>
        <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToList} />
        <Screen edges={['left', 'right', 'bottom']}>
          {loading ? (
            <LoadingState />
          ) : izinSync === 'error' ? (
            // Listener gagal: izinnya mungkin ada, jadi jangan menyatakan tidak ditemukan.
            <View style={styles.body}>
              <Banner tone="danger" message="Gagal memuat data. Periksa koneksi lalu coba lagi." />
              <Button label="Kembali" onPress={goBackToList} variant="secondary" />
            </View>
          ) : (
            <EmptyState
              title="Izin tidak ditemukan"
              message="Izin mungkin sudah dihapus atau tautan tidak valid."
              action={{ label: 'Kembali', onPress: goBackToList }}
            />
          )}
        </Screen>
      </View>
    );
  }

  const praktikanName = getPraktikanName(izin.userName);
  // Aturan sama dengan filter "Perlu diperiksa", termasuk status tak dikenal.
  const isPending = izinFilterOf(izin.status) === 'pending';
  const catatan = izin.review?.catatan?.trim();

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.body}>
          <View style={styles.header}>
            <Text role="heading" style={styles.name}>
              {praktikanName}
            </Text>
            <Text style={styles.session}>{getIzinSessionLabel(session ?? undefined, sessionsLoading)}</Text>
            <IzinStatusBadge status={izin.status} />
          </View>

          <Card>
            <View style={styles.fields}>
              <DetailField label="Diajukan" value={formatDateTime(izin.createdAt)} />
              <DetailField label="Alasan" value={izin.alasan} />
              {catatan ? <DetailField label="Catatan asisten" value={catatan} /> : null}
            </View>
          </Card>

          {isPending ? <Text style={styles.caption}>{REVIEW_PENDING_CAPTION}</Text> : null}
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  name: {
    ...typography.title,
    color: colors.text,
  },
  session: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  fields: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  fieldValue: {
    ...typography.body,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
