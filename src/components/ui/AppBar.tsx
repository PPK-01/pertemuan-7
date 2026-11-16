import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type AppBarProps = {
  title?: string;
  subtitle?: string;
  canGoBack?: boolean;
  onGoBack?: () => void;
  rightAction?: ReactNode;
};

// Ukuran tanpa padanan token: tinggi bar mengikuti app bar Material, slot samping memuat
// tombol kembali, dan ikon chevron digambar dari dua garis.
const BAR_HEIGHT = 56;
const SIDE_SLOT_WIDTH = 48;
const BACK_ICON_SIZE = 20;
const CHEVRON_LENGTH = 10;
const CHEVRON_THICKNESS = 2.5;
const CHEVRON_RADIUS = 1;
const CHEVRON_OFFSET = 3;
// Subjudul sedikit diredupkan di atas navy; nilainya sama dengan petunjuk di panel kode.
const SUBTITLE_OPACITY = 0.85;

function BackIcon() {
  return (
    <View style={styles.backIconFrame}>
      <View style={styles.chevronTop} />
      <View style={styles.chevronBottom} />
    </View>
  );
}

export function AppBar({
  title = 'Presensi Praktikum',
  subtitle,
  canGoBack = false,
  onGoBack,
  rightAction,
}: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <View style={styles.sideSlot}>
          {canGoBack && onGoBack ? (
            <Pressable
              onPress={onGoBack}
              role="button"
              aria-label="Kembali ke layar sebelumnya"
              style={({ pressed }) => [styles.backButton, pressed && { opacity: PRESSED_OPACITY }]}
            >
              <BackIcon />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.centerSlot}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightAction ?? null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // TODO token: garis tipis putih transparan di atas navy (usulan colors.onPrimarySubtle)
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sideSlot: {
    width: SIDE_SLOT_WIDTH,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Judul bar lebih kecil dari typography.title agar muat satu baris di 360dp; tiap nilai tetap
  // diambil dari token yang angkanya sama.
  title: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.label.lineHeight,
    fontWeight: typography.title.fontWeight,
    color: colors.onPrimary,
  },
  subtitle: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    fontWeight: typography.caption.fontWeight,
    color: colors.onPrimary,
    opacity: SUBTITLE_OPACITY,
    marginTop: spacing.xs / 2,
  },
  backButton: {
    minWidth: layout.minTouch,
    minHeight: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconFrame: {
    width: BACK_ICON_SIZE,
    height: BACK_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chevronTop: {
    width: CHEVRON_LENGTH,
    height: CHEVRON_THICKNESS,
    backgroundColor: colors.onPrimary,
    borderRadius: CHEVRON_RADIUS,
    transform: [{ rotate: '-45deg' }, { translateY: -CHEVRON_OFFSET }],
  },
  chevronBottom: {
    width: CHEVRON_LENGTH,
    height: CHEVRON_THICKNESS,
    backgroundColor: colors.onPrimary,
    borderRadius: CHEVRON_RADIUS,
    transform: [{ rotate: '45deg' }, { translateY: CHEVRON_OFFSET }],
  },
});
