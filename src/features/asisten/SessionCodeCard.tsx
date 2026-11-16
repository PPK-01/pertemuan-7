import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useIsOnline, useSessionCode } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Kelas } from '@/types';

// useSessionCode hanya mengembalikan string | null, jadi gagal baca private/code tidak bisa
// dibedakan dari masih memuat. Setelah batas ini kode dianggap tidak tersedia; nilainya sama
// dengan batas waktu tulis FR-29.
const CODE_WAIT_MS = 10000;
// Jarak antar digit kode; tidak ada token letterSpacing (gaya Sprint 1).
const CODE_LETTER_SPACING = 4;

export type SessionCodeCardProps = {
  sessionId: string;
  kelas: Kelas;
};

/**
 * Kode sesi 4 digit untuk asisten (FR-06). Dipasang hanya saat sesi Dibuka, sehingga kode
 * yang tersimpan di store tidak tampil lagi setelah sesi ditutup.
 */
export function SessionCodeCard({ sessionId, kelas }: SessionCodeCardProps) {
  const code = useSessionCode(sessionId);
  const isOnline = useIsOnline();
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    if (code !== null) return;
    const timer = setTimeout(() => setWaitedTooLong(true), CODE_WAIT_MS);
    return () => clearTimeout(timer);
  }, [code]);

  const unavailable = code === null && (waitedTooLong || !isOnline);

  return (
    <Card>
      <View style={styles.code}>
        <Text style={styles.codeLabel}>Kode sesi</Text>
        {code !== null ? (
          <>
            {/* Digit dipisah spasi agar TalkBack membacanya per digit, bukan sebagai bilangan. */}
            <Text aria-label={`Kode sesi ${code.split('').join(' ')}`} style={styles.codeValue}>
              {code}
            </Text>
            <Text style={styles.codeHint}>{`Bagikan kode ini ke praktikan kelas ${kelas}.`}</Text>
          </>
        ) : unavailable ? (
          <Text style={styles.codeHint}>
            Kode sesi belum bisa dimuat. Periksa koneksi lalu buka ulang layar ini.
          </Text>
        ) : (
          <LoadingState label="Memuat kode sesi…" />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  code: { gap: spacing.sm },
  codeLabel: { ...typography.label, color: colors.textMuted },
  codeValue: {
    ...typography.display,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: CODE_LETTER_SPACING,
  },
  codeHint: { ...typography.body, color: colors.textMuted },
});
