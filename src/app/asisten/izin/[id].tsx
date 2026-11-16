import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AiSuggestionCard } from '@/components/izin/AiSuggestionCard';
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
import { OFFLINE_ACTION_HINT, writeErrorMessage } from '@/features/asisten/writeErrorMessage';
import {
  useAppStore,
  useIsOnline,
  useIzinById,
  useSessionById,
  useSyncState,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { formatDateTime } from '@/utils/time';

// Detail baca-saja; tombol Setujui/Tolak menyusul bersama pemeriksaan izin.
const REVIEW_PENDING_CAPTION = 'Pemeriksaan izin akan tersedia di pembaruan berikutnya.';

// id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar.
type Feedback = { id: number; tone: 'success' | 'danger' | 'info'; message: string };

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
  const isOnline = useIsOnline();
  const retryAi = useAppStore((state) => state.retryAi);

  // retryAi sedang menunggu Result; ref menahan tekanan beruntun sebelum render berikutnya.
  const [retrying, setRetrying] = useState(false);
  const retryingRef = useRef(false);
  const [feedback, setFeedbackState] = useState<Feedback | null>(null);
  const setFeedback = (next: Omit<Feedback, 'id'>) =>
    setFeedbackState((prev) => ({ ...next, id: (prev?.id ?? 0) + 1 }));

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
  // pending_ai tanpa hasil = analisis belum selesai. Izin lama bisa saja pending_ai tetapi
  // sudah memuat ai; hasil itu tetap ditampilkan.
  const awaitingAi = !izin.ai && izin.status === 'pending_ai';

  const handleRunAi = async () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);
    const res = await retryAi(izin.id);
    retryingRef.current = false;
    setRetrying(false);
    // Hasil sukses sudah terlihat di kartu lewat listener; hanya kegagalan tulis yang diumumkan.
    if (!res.ok) setFeedback({ tone: 'danger', message: writeErrorMessage(res.code) });
  };

  return (
    <View style={styles.container}>
      <AppBar subtitle="Detail izin" canGoBack onGoBack={goBackToList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.body}>
          {feedback ? <Banner key={feedback.id} tone={feedback.tone} message={feedback.message} /> : null}

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
            </View>
          </Card>

          {/* Saran AI hanya relevan selama izin belum diputuskan atau bila hasilnya tersimpan. */}
          {isPending || izin.ai ? (
            <View style={styles.actionGroup}>
              <AiSuggestionCard
                ai={izin.ai}
                onRetry={isPending ? handleRunAi : undefined}
                retrying={retrying}
                retryDisabled={!isOnline}
              />
              {awaitingAi ? (
                // SRS §3.3: bila aplikasi praktikan tertutup sebelum AI selesai, asisten dapat
                // menjalankan AI dari sisinya. Kartu memuat tidak punya tombol (props SRS §8).
                <>
                  <Text style={styles.caption}>
                    Analisis biasanya berjalan otomatis di aplikasi praktikan. Bila status tidak
                    berubah, jalankan dari perangkat ini.
                  </Text>
                  <Button
                    label="Jalankan analisis AI"
                    variant="secondary"
                    onPress={handleRunAi}
                    loading={retrying}
                    disabled={!isOnline}
                  />
                </>
              ) : null}
              {isPending && !isOnline && (awaitingAi || izin.ai?.state === 'failed') ? (
                <Text style={styles.caption}>{OFFLINE_ACTION_HINT}</Text>
              ) : null}
            </View>
          ) : null}

          {isPending ? <Text style={styles.caption}>{REVIEW_PENDING_CAPTION}</Text> : null}

          {catatan ? (
            <Card>
              <DetailField label="Catatan asisten" value={catatan} />
            </Card>
          ) : null}
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
  actionGroup: {
    gap: spacing.sm,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
