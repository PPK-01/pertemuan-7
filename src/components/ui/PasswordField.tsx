import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PRESSED_OPACITY } from '@/components/ui/pressable';
import { TextField } from '@/components/ui/TextField';
import type { TextFieldProps } from '@/components/ui/TextField';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type PasswordFieldProps = Omit<
  TextFieldProps,
  'secureTextEntry' | 'right' | 'autoComplete' | 'autoCapitalize' | 'autoCorrect' | 'textContentType'
> & {
  /** 'new-password' untuk registrasi agar pengelola sandi menawarkan sandi baru. */
  autoComplete?: 'password' | 'new-password';
};

const CONTENT_TYPE = {
  password: 'password',
  'new-password': 'newPassword',
} as const;

export function PasswordField({ autoComplete = 'password', ...fieldProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...fieldProps}
      secureTextEntry={!visible}
      autoComplete={autoComplete}
      textContentType={CONTENT_TYPE[autoComplete]}
      autoCapitalize="none"
      autoCorrect={false}
      right={
        <Pressable
          onPress={() => setVisible((current) => !current)}
          role="button"
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          style={({ pressed }) => [styles.toggle, pressed && { opacity: PRESSED_OPACITY }]}
        >
          <Text style={styles.toggleText}>{visible ? 'Sembunyikan' : 'Tampilkan'}</Text>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: layout.minTouch,
    minHeight: layout.minTouch,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    ...typography.label,
    color: colors.primary,
  },
});
