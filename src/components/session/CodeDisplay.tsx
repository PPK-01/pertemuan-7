import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type CodeDisplayProps = {
  code?: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

// Ukuran tanpa padanan token: sel kode cukup lebar untuk satu digit typography.code, garis
// tepi panel sama dengan Card, dan petunjuk sedikit diredupkan di atas navy.
const CELL_WIDTH = 64;
const CELL_HEIGHT = 76;
const BORDER_WIDTH = 1;
const HINT_OPACITY = 0.85;

export function CodeDisplay({
  code = '----',
  hint = 'Bagikan kode ini ke kelas.',
  style,
}: CodeDisplayProps) {
  const digits = code.padStart(4, '0').slice(0, 4).split('');

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Kode sesi</Text>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Kode sesi ${code.split('').join(' ')}`}
        style={styles.cellRow}
      >
        {digits.map((digit, index) => (
          <View key={index} style={styles.cell}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: radius.identity,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: BORDER_WIDTH,
    // TODO token: garis tipis putih transparan di atas navy (usulan colors.onPrimarySubtle)
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.onPrimary,
  },
  cellRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  cell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: typography.code.fontSize,
    lineHeight: typography.code.lineHeight,
    fontWeight: typography.code.fontWeight,
    fontVariant: typography.code.fontVariant,
    color: colors.primary,
  },
  hint: {
    fontSize: typography.body.fontSize,
    color: colors.onPrimary,
    opacity: HINT_OPACITY,
    textAlign: 'center',
  },
});
