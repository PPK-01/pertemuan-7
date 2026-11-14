import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { IzinStatusBadge, getIzinStatusLabel } from '@/components/izin/IzinStatusBadge';
import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Izin } from '@/types';
import { formatDateTime } from '@/utils/time';

export type IzinRowProps = {
  izin: Izin;
  /** Dirakit pemanggil; komponen tidak mencari data user. */
  praktikanName: string;
  /** Mis. "Pemrograman Mobile · Sen 17 Nov, 09.00"; dirakit pemanggil. */
  sessionLabel: string;
  /** Ada = baris bisa ditekan, mis. ke pemeriksaan izin. */
  onPress?: () => void;
};

/** @deprecated Bentuk props lama; dihapus setelah pemanggil dimigrasi. */
type LegacyIzinRowProps = {
  izin: Izin;
  praktikum?: string;
  topik?: string;
  onPress?: () => void;
};

// Nama dan badge bertumpuk bila width / fontScale di bawah nilai ini (pola sama dengan BottomSheet).
const STACK_HEADER_BELOW = 360;

function normalizeProps(props: IzinRowProps | LegacyIzinRowProps): IzinRowProps {
  if ('praktikanName' in props) return props;
  return {
    izin: props.izin,
    praktikanName: props.izin.userName,
    sessionLabel: [props.praktikum ?? 'Praktikum', props.topik].filter(Boolean).join(' · '),
    onPress: props.onPress,
  };
}

export function IzinRow(props: IzinRowProps | LegacyIzinRowProps) {
  const { izin, praktikanName, sessionLabel, onPress } = normalizeProps(props);
  const { width, fontScale } = useWindowDimensions();
  const stacked = width / fontScale < STACK_HEADER_BELOW;
  const a11yLabel = `${praktikanName}, ${sessionLabel}, ${getIzinStatusLabel(izin.status)}`;

  const content = (
    <>
      <View style={[styles.header, stacked && styles.headerStacked]}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{praktikanName}</Text>
          <Text style={styles.session}>{sessionLabel}</Text>
        </View>
        <IzinStatusBadge status={izin.status} />
      </View>

      <Text style={styles.alasan} numberOfLines={2}>
        {izin.alasan}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.time}>Diajukan {formatDateTime(izin.createdAt)}</Text>
        {izin.review?.catatan ? <Text style={styles.note}>Ada catatan asisten</Text> : null}
      </View>
    </>
  );

  if (!onPress) {
    // Tidak bisa ditekan: dibaca sebagai satu kesatuan, seperti baris rekap.
    return (
      <View accessible aria-label={a11yLabel} style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label={a11yLabel}
      style={({ pressed }) => [styles.row, pressed && { opacity: PRESSED_OPACITY }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.minTouch,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerStacked: {
    flexDirection: 'column',
  },
  titleBlock: {
    flexGrow: 1,
    flexShrink: 1,
    gap: spacing.xs / 2,
  },
  name: {
    ...typography.heading,
    color: colors.text,
  },
  session: {
    ...typography.caption,
    color: colors.textMuted,
  },
  alasan: {
    ...typography.body,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  note: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
});
