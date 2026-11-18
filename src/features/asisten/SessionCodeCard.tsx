import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useSessionCode } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Kelas } from '@/types';

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
  const { code, status, retry } = useSessionCode(sessionId);

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
        ) : status === 'error' ? (
          <>
            <Text style={styles.codeHint}>Kode sesi belum bisa dimuat.</Text>
            <Button label="Coba lagi" variant="secondary" onPress={retry} />
          </>
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
