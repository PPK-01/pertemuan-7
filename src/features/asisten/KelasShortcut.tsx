import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type KelasShortcutProps = {
  onPress: () => void;
};

/** Pintasan beranda asisten ke daftar kelas praktikum; tampilannya sepadan dengan IzinShortcut. */
export function KelasShortcut({ onPress }: KelasShortcutProps) {
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-label="Kelas, kelola kelas praktikum"
      style={({ pressed }) => [styles.button, pressed && { opacity: PRESSED_OPACITY }]}
    >
      <Text style={styles.label}>Kelas</Text>
      <View style={styles.spacer} />
      <Text style={styles.hint}>Kelola</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: layout.minTouch,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { ...typography.label, color: colors.text },
  spacer: { flex: 1 },
  hint: { ...typography.caption, color: colors.textMuted },
});
