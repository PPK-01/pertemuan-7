import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { IzinStatus } from '@/types';

export type IzinStatusBadgeProps = {
  status: IzinStatus;
  /** 'sm' untuk baris padat; 'md' sejajar dengan StatusBadge sesi. */
  size?: 'sm' | 'md';
};

/** Teks status izin (SRS bagian 8 dan FR-24), netral untuk praktikan maupun asisten. */
export const IZIN_STATUS_LABEL = {
  pending_ai: 'Menunggu analisis',
  pending_review: 'Menunggu pemeriksaan asisten',
  approved: 'Disetujui',
  rejected: 'Ditolak',
} as const satisfies Record<IzinStatus, string>;

/** Data Firestore bisa memuat status di luar tipe; jatuh ke status yang menunggu asisten. */
function toKnownStatus(status: IzinStatus): IzinStatus {
  return status in IZIN_STATUS_LABEL ? status : 'pending_review';
}

/** Label yang sama dengan yang tampil di badge, untuk aria-label pemanggil. */
export function getIzinStatusLabel(status: IzinStatus): string {
  return IZIN_STATUS_LABEL[toKnownStatus(status)];
}

// Simbol teks karena paket ikon belum tersedia. Bentuknya sengaja berbeda dari titik
// pada StatusBadge sesi supaya "Menunggu analisis" tidak tertukar dengan "Dibuka".
const IZIN_STATUS_GLYPH = {
  pending_ai: '…',
  pending_review: '!',
  approved: '✓',
  rejected: '✕',
} as const satisfies Record<IzinStatus, string>;

export function IzinStatusBadge({ status, size = 'md' }: IzinStatusBadgeProps) {
  const safeStatus = toKnownStatus(status);
  const { bg, text } = colors.izin[safeStatus];
  const label = IZIN_STATUS_LABEL[safeStatus];
  const sizeStyles = size === 'sm' ? smStyles : mdStyles;

  return (
    <View
      accessible
      aria-label={`Status izin: ${label}`}
      style={[styles.badge, sizeStyles.badge, { backgroundColor: bg }]}
    >
      <View aria-hidden style={[styles.icon, sizeStyles.icon, { backgroundColor: text }]}>
        {/* Ikon dekoratif berukuran tetap; teks label di sampingnya tetap ikut skala font. */}
        <Text allowFontScaling={false} style={[styles.glyph, { color: bg }]}>
          {IZIN_STATUS_GLYPH[safeStatus]}
        </Text>
      </View>
      <Text style={[styles.label, sizeStyles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Boleh menyusut agar label panjang membungkus di baris sempit, bukan meluap keluar kartu.
    flexShrink: 1,
    borderRadius: radius.full,
  },
  label: {
    flexShrink: 1,
  },
  icon: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    ...typography.caption,
    fontWeight: '700',
  },
});

// Diameter ikon mengikuti tinggi baris teks agar badge tidak bertambah tinggi.
const mdStyles = StyleSheet.create({
  badge: {
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  icon: {
    width: typography.caption.lineHeight,
    height: typography.caption.lineHeight,
  },
  label: typography.label,
});

const smStyles = StyleSheet.create({
  badge: {
    gap: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  icon: {
    width: typography.caption.lineHeight,
    height: typography.caption.lineHeight,
  },
  label: { ...typography.caption, fontWeight: '600' },
});
