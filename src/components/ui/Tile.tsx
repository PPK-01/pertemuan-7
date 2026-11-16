import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type TileProps = {
  label: string;
  count: number;
  iconType: 'all' | 'scheduled' | 'open' | 'closed';
  selected?: boolean;
  onPress: () => void;
};

// Ukuran tanpa padanan token: lebar minimum agar empat ubin muat di 360dp, garis tepi sama
// dengan Card, dan ikon status yang digambar dari View di dalam kotak ICON_BOX_SIZE.
const TILE_MIN_WIDTH = 70;
const BORDER_WIDTH = 1;
const ICON_BOX_SIZE = 24;
const ICON_STROKE = 1.5;
const ICON_CORNER = 1;
const GRID_SIZE = 14;
const GRID_DOT_SIZE = 5;
const CLOCK_SIZE = 16;
const CLOCK_HAND_LENGTH = 5;
const OPEN_DOT_SIZE = 14;
const CLOSED_BOX_SIZE = 13;
const CLOSED_BOX_RADIUS = 2;

function TileIcon({ type, selected }: { type: TileProps['iconType']; selected?: boolean }) {
  const tint = selected ? colors.accent : colors.primary;

  if (type === 'all') {
    return (
      <View style={styles.iconBox}>
        <View style={styles.grid2x2}>
          <View style={[styles.gridDot, { backgroundColor: tint }]} />
          <View style={[styles.gridDot, { backgroundColor: tint }]} />
          <View style={[styles.gridDot, { backgroundColor: tint }]} />
          <View style={[styles.gridDot, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }

  if (type === 'scheduled') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.hollowCircle, { borderColor: tint }]}>
          <View style={[styles.clockHand, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }

  if (type === 'open') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.filledCircle, { backgroundColor: tint }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconBox}>
      <View style={[styles.closedBox, { backgroundColor: tint }]} />
    </View>
  );
}

export function Tile({ label, count, iconType, selected = false, onPress }: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      aria-label={`${label}, ${count} sesi`}
      style={({ pressed }) => [
        styles.tile,
        selected ? styles.tileSelected : styles.tileUnselected,
        pressed && { opacity: PRESSED_OPACITY },
      ]}
    >
      <View style={styles.topRow}>
        <TileIcon type={iconType} selected={selected} />
        <Text
          style={[
            styles.countText,
            selected ? styles.textSelected : styles.textUnselected,
          ]}
        >
          {count}
        </Text>
      </View>
      <Text
        style={[
          styles.labelText,
          selected ? styles.textSelected : styles.textUnselected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: TILE_MIN_WIDTH,
    minHeight: layout.minTouch + spacing.xl,
    borderRadius: radius.tile,
    padding: spacing.md,
    justifyContent: 'space-between',
    borderWidth: BORDER_WIDTH,
  },
  tileUnselected: {
    backgroundColor: colors.tile,
    borderColor: colors.border,
  },
  tileSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.label.fontWeight,
  },
  countText: {
    fontSize: typography.heading.fontSize,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textUnselected: {
    color: colors.text,
  },
  textSelected: {
    color: colors.onPrimary,
  },
  grid2x2: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridDot: {
    width: GRID_DOT_SIZE,
    height: GRID_DOT_SIZE,
    borderRadius: ICON_CORNER,
  },
  hollowCircle: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: radius.full,
    borderWidth: ICON_STROKE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHand: {
    width: ICON_STROKE,
    height: CLOCK_HAND_LENGTH,
    borderRadius: ICON_CORNER,
  },
  filledCircle: {
    width: OPEN_DOT_SIZE,
    height: OPEN_DOT_SIZE,
    borderRadius: radius.full,
  },
  closedBox: {
    width: CLOSED_BOX_SIZE,
    height: CLOSED_BOX_SIZE,
    borderRadius: CLOSED_BOX_RADIUS,
  },
});
