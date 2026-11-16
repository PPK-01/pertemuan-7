import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatSessionTime } from '@/components/session/sessionTime';
import { StatusBadge } from '@/components/session/StatusBadge';
import { STATUS_LABEL } from '@/components/session/statusLabel';
import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Session } from '@/types';

export type SessionRowProps = {
  session: Session;
  onPress?: () => void;
  footerText?: string;
};

// Ukuran tanpa padanan token: garis tepi kartu sama dengan Card, dan jarak baris topik yang
// lebih rapat dari typography.body agar dua baris topik tetap ringkas.
const BORDER_WIDTH = 1;
const TOPIK_LINE_HEIGHT = 22;

export function SessionRow({ session, onPress, footerText }: SessionRowProps) {
  const timeText = formatSessionTime(session);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      role="button"
      // Status dibacakan dengan teks yang sama dengan badge, bukan nilai mentah ('open').
      aria-label={`${session.praktikum}, Kelas ${session.kelas}, ${session.topik}, ${STATUS_LABEL[session.status]}`}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && { opacity: PRESSED_OPACITY },
      ]}
    >
      <View style={styles.topLine}>
        <Text style={styles.praktikum} numberOfLines={1}>
          {session.praktikum}
        </Text>
        <StatusBadge status={session.status} />
      </View>

      <Text style={styles.topik} numberOfLines={2}>
        {session.topik}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Kelas & Ruang:</Text>
        <Text style={styles.metaValue}>Kelas {session.kelas} • {session.ruang}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Waktu:</Text>
        <Text style={styles.metaValueTime}>{timeText}</Text>
      </View>

      {footerText ? (
        <View style={styles.footerBox}>
          <Text style={styles.footerText}>{footerText}</Text>
        </View>
      ) : null}
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
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  praktikum: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.primary,
    flex: 1,
  },
  topik: {
    fontSize: typography.body.fontSize,
    lineHeight: TOPIK_LINE_HEIGHT,
    fontWeight: '600',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  metaValue: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    fontWeight: typography.label.fontWeight,
  },
  metaValueTime: {
    fontSize: typography.caption.fontSize,
    color: colors.text,
    fontWeight: typography.label.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  footerBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
