import { Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Tidak bisa ditekan; pilihan tetap terlihat, mis. kolom yang dikunci. */
  disabled?: boolean;
  /** Khusus layout (margin, flex, alignSelf), bukan warna/ukuran. */
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, selected, onPress, disabled = false, style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        disabled && (selected ? styles.disabledSelected : styles.disabled),
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          disabled && !selected && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // Pilihan terkunci tetap terbaca: onPrimary di atas disabled.text kontrasnya 4.9:1.
  disabledSelected: {
    backgroundColor: colors.disabled.text,
    borderColor: colors.disabled.text,
  },
  disabled: {
    backgroundColor: colors.disabled.bg,
    borderColor: colors.disabled.bg,
  },
  pressed: { opacity: PRESSED_OPACITY },
  label: { ...typography.label, color: colors.text },
  labelSelected: { color: colors.onPrimary },
  labelDisabled: { color: colors.disabled.text },
});
