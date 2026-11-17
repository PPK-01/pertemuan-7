import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IdentityCard } from '@/components/ui/IdentityCard';
import { Screen } from '@/components/ui/Screen';
import { KeluarSheet } from '@/features/asisten/KeluarSheet';
import {
  useAppStore,
  useAttendanceByUser,
  useCurrentUser,
  useIzinByUser,
  useSessionsForUser,
} from '@/store/appStore';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PraktikanProfilScreen() {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id ?? '';
  const logout = useAppStore((state) => state.logout);

  const sessions = useSessionsForUser(userId);
  const attendances = useAttendanceByUser(userId);
  const izinList = useIzinByUser(userId);

  const [keluarVisible, setKeluarVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [keluarError, setKeluarError] = useState<string | null>(null);

  const hadirCount = attendances.length;
  const izinApprovedCount = useMemo(
    () => izinList.filter((i) => i.status === 'approved').length,
    [izinList],
  );
  const totalSesi = sessions.length;

  const confirmKeluar = async () => {
    setKeluarError(null);
    setLoggingOut(true);
    try {
      await logout();
      setKeluarVisible(false);
      router.replace('/(auth)/login');
    } catch {
      setKeluarError('Gagal keluar. Coba lagi.');
    } finally {
      setLoggingOut(false);
    }
  };

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <AppBar subtitle="Profil" />
        <Screen edges={['left', 'right', 'bottom']}>
          <EmptyState
            title="Identitas tidak ditemukan"
            message="Silakan masuk kembali ke akun praktikan."
            action={{ label: 'Masuk', onPress: () => router.replace('/(auth)/login') }}
          />
        </Screen>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar subtitle="Profil Saya" />

      <Screen noPadding edges={['left', 'right']}>
        <View style={styles.scrollBody}>
          {/* Kartu Identitas */}
          <IdentityCard
            name={currentUser.name}
            keyInfo={currentUser.kelas ? `Kelas ${currentUser.kelas}` : 'Praktikan'}
            supportingInfo="Laboratorium Komputer"
            actionLabel="Keluar"
            onAction={() => setKeluarVisible(true)}
          />

          {/* Ringkasan Kehadiran */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{hadirCount}</Text>
              <Text style={styles.summaryLabel}>Total Hadir</Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryCardIzin]}>
              <Text style={[styles.summaryNumber, styles.summaryNumberIzin]}>
                {izinApprovedCount}
              </Text>
              <Text style={styles.summaryLabel}>Izin Diterima</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{totalSesi}</Text>
              <Text style={styles.summaryLabel}>Total Sesi</Text>
            </View>
          </View>

          {/* Detail Informasi Akun */}
          <Card>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nama Lengkap</Text>
                <Text style={styles.infoValue}>{currentUser.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email Kampus</Text>
                <Text style={styles.infoValue}>{currentUser.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kelas Praktikum</Text>
                <Text style={styles.infoValue}>Kelas {currentUser.kelas ?? '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Peran Akun</Text>
                <Text style={styles.infoValue}>Praktikan</Text>
              </View>
            </View>
          </Card>

          {/* Panduan Singkat */}
          <Card>
            <Text style={styles.sectionTitle}>Panduan Presensi</Text>
            <Text style={styles.guideText}>
              • Pastikan kamu hadir di lab tepat waktu sebelum sesi ditutup oleh asisten.{'\n'}
              • Masukkan kode 4 digit yang ditampilkan oleh asisten di depan kelas.{'\n'}
              • Jika berhalangan hadir, ajukan izin melalui tab Izin sebelum sesi selesai.
            </Text>
          </Card>

          {/* Tombol Logout Utama */}
          <Button
            label="Keluar dari Akun"
            variant="danger"
            onPress={() => setKeluarVisible(true)}
          />

          <Text style={styles.versionText}>Rawuh Mobile • v1.0.0</Text>
        </View>
      </Screen>

      <KeluarSheet
        visible={keluarVisible}
        loading={loggingOut}
        errorMessage={keluarError}
        onClose={() => setKeluarVisible(false)}
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
  scrollBody: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  summaryCardIzin: {
    backgroundColor: '#F7F8FC',
  },
  summaryNumber: {
    ...typography.heading,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  summaryNumberIzin: {
    color: '#1B2F8F',
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.label,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  guideText: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});