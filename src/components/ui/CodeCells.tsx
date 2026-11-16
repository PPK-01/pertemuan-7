import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type CodeCellsProps = {
  /** Nilai kode 4 karakter atau kurang. */
  value?: string;
  /** Varian tampilan motif sel kode. */
  variant: 'display-navy' | 'input-light' | 'signature-navy';
  /** Indeks sel yang sedang aktif/fokus (0..3). */
  activeIndex?: number;
};

// Ukuran tanpa padanan token: tiga varian sel kode punya ukuran sendiri (motif kecil di login,
// panel tampilan, dan sel input), garis tepi tipis, dan digit input di antara heading dan code.
const SIGNATURE_CELL_WIDTH = 38;
const SIGNATURE_CELL_HEIGHT = 46;
const DISPLAY_CELL_WIDTH = 64;
const DISPLAY_CELL_HEIGHT = 74;
const INPUT_CELL_WIDTH = 60;
const INPUT_CELL_HEIGHT = 68;
const BORDER_WIDTH = 1;
const CELL_BORDER_WIDTH = 1.5;
const ACTIVE_BORDER_WIDTH = 2;
const INPUT_DIGIT_SIZE = 32;

export function CodeCells({ value = '', variant, activeIndex = -1 }: CodeCellsProps) {
  const chars = [
    value[0] ?? '',
    value[1] ?? '',
    value[2] ?? '',
    value[3] ?? '',
  ];

  if (variant === 'signature-navy') {
    return (
      <View style={styles.row}>
        {chars.map((_, i) => (
          <View
            key={i}
            style={[
              styles.cellSignature,
              i === 0 ? styles.cellSignatureActive : styles.cellSignatureInactive,
            ]}
          />
        ))}
      </View>
    );
  }

  if (variant === 'display-navy') {
    return (
      <View style={styles.row}>
        {chars.map((char, i) => (
          <View key={i} style={styles.cellDisplayNavy}>
            <Text style={styles.textDisplayNavy}>{char || '-'}</Text>
          </View>
        ))}
      </View>
    );
  }

  // variant === 'input-light'
  return (
    <View style={styles.row}>
      {chars.map((char, i) => {
        const isActive = i === activeIndex;
        const isFilled = char.length > 0;
        return (
          <View
            key={i}
            style={[
              styles.cellInputLight,
              isFilled && styles.cellInputFilled,
              isActive && styles.cellInputActive,
            ]}
          >
            <Text style={styles.textInputLight}>{char}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  cellSignature: {
    width: SIGNATURE_CELL_WIDTH,
    height: SIGNATURE_CELL_HEIGHT,
    borderRadius: radius.md,
    // TODO token: isian putih transparan di atas navy (usulan colors.onPrimarySubtle)
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: CELL_BORDER_WIDTH,
  },
  cellSignatureActive: {
    borderColor: colors.accent,
    // TODO token: isian kuning aksen transparan di atas navy (usulan colors.accentSubtle)
    backgroundColor: 'rgba(255, 196, 0, 0.12)',
  },
  cellSignatureInactive: {
    // TODO token: tepi sel tidak aktif di atas navy (usulan colors.onPrimaryBorder)
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  cellDisplayNavy: {
    width: DISPLAY_CELL_WIDTH,
    height: DISPLAY_CELL_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: colors.border,
  },
  textDisplayNavy: {
    fontSize: typography.code.fontSize,
    lineHeight: typography.code.lineHeight,
    fontWeight: typography.code.fontWeight,
    fontVariant: typography.code.fontVariant,
    color: colors.primary,
  },
  cellInputLight: {
    width: INPUT_CELL_WIDTH,
    height: INPUT_CELL_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: CELL_BORDER_WIDTH,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellInputFilled: {
    borderColor: colors.text,
  },
  cellInputActive: {
    borderColor: colors.primary,
    borderWidth: ACTIVE_BORDER_WIDTH,
  },
  textInputLight: {
    fontSize: INPUT_DIGIT_SIZE,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
});
