import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { STATUS_LABEL } from '@/components/session/statusLabel';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { SessionStatus } from '@/types';

export type StatusBadgeProps = {
  status: SessionStatus;
  /** Khusus layout (margin, flex, alignSelf), bukan warna/ukuran. */
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const { bg, text } = colors.status[status];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {status === 'open' ? (
        <View style={[styles.indicatorCircleFilled, { backgroundColor: text }]} />
      ) : status === 'scheduled' ? (
        <View style={[styles.indicatorCircleHollow, { borderColor: text }]} />
      ) : (
        <View style={[styles.indicatorSquare, { backgroundColor: text }]} />
      )}
      <Text style={[styles.label, { color: text }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

// Ukuran tanpa padanan token: penanda bentuk kecil di samping label (titik penuh, lingkaran
// kosong, kotak) dengan garis lingkaran kosong yang cukup tebal agar terlihat di 6dp.
const INDICATOR_SIZE = 6;
const HOLLOW_STROKE = 1.5;
const SQUARE_RADIUS = 1;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    flexShrink: 0,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: typography.label,
  indicatorCircleFilled: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radius.full,
  },
  indicatorCircleHollow: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: radius.full,
    borderWidth: HOLLOW_STROKE,
  },
  indicatorSquare: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: SQUARE_RADIUS,
  },
});
