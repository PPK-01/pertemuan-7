import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Teks bantuan di bawah input, mis. format input. */
  hint?: string;
  /** Ada nilai = state error; pesan ini menggantikan hint. */
  error?: string;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  autoCorrect?: boolean;
  textContentType?: TextInputProps['textContentType'];
  /** Aksesori di sisi kanan dalam kotak input, mis. tombol tampilkan kata sandi. */
  right?: ReactNode;
  /** Tidak bisa diedit; nilai tetap terbaca, mis. kolom yang dikunci. */
  disabled?: boolean;
  /** Khusus layout (margin, flex, alignSelf), bukan warna/ukuran. */
  style?: StyleProp<ViewStyle>;
};

const BORDER_WIDTH = 1;
const FOCUS_BORDER_WIDTH = 2;
const FOCUS_INSET = FOCUS_BORDER_WIDTH - BORDER_WIDTH;
// aria-describedby hanya dipakai react-native-web; Android dan iOS mengabaikannya.
const DESCRIBED_BY_SUPPORTED = Platform.OS === 'web';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  maxLength,
  autoCapitalize,
  secureTextEntry,
  autoComplete,
  autoCorrect,
  textContentType,
  right,
  disabled = false,
  style,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [rightWidth, setRightWidth] = useState(0);
  // Id dari label bisa berisi spasi, sedangkan aria-describedby di web memisah id dengan spasi.
  const messageId = useId();
  const hasError = Boolean(error);
  const message = hasError ? error : hint;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          editable={!disabled}
          aria-disabled={disabled}
          // Native tidak mendukung aria-describedby: error digabung ke label agar tetap dibacakan
          // walau petunjuk TalkBack dimatikan pengguna.
          aria-label={!DESCRIBED_BY_SUPPORTED && hasError ? `${label}, ${error}` : label}
          aria-describedby={message ? messageId : undefined}
          // Pengecualian ARIA: RN belum punya prop ARIA untuk hint; hint biasa (bukan error)
          // dibacakan TalkBack setelah label lewat accessibilityHint.
          accessibilityHint={DESCRIBED_BY_SUPPORTED || hasError ? undefined : hint}
          aria-invalid={hasError}
          style={[
            styles.input,
            hasError && styles.inputError,
            focused && !hasError && styles.inputFocused,
            disabled && styles.inputDisabled,
            right ? { paddingRight: rightWidth } : null,
          ]}
        />
        {/* Menutupi tepi kanan input setinggi kotaknya agar area sentuh aksesori tidak terpotong. */}
        {right ? (
          <View
            style={styles.right}
            onLayout={(event) => setRightWidth(event.nativeEvent.layout.width)}
          >
            {right}
          </View>
        ) : null}
      </View>
      {message ? (
        <Text
          nativeID={messageId}
          style={[styles.message, hasError && styles.messageError]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.text },
  input: {
    ...typography.body,
    minHeight: layout.minTouch,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...Platform.select({
      web: { outlineWidth: 0 } as const,
    }),
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: FOCUS_BORDER_WIDTH,
    paddingHorizontal: spacing.md - FOCUS_INSET,
    paddingVertical: spacing.sm - FOCUS_INSET,
  },
  inputError: {
    borderColor: colors.feedback.danger.text,
    borderWidth: FOCUS_BORDER_WIDTH,
    paddingHorizontal: spacing.md - FOCUS_INSET,
    paddingVertical: spacing.sm - FOCUS_INSET,
  },
  inputDisabled: {
    backgroundColor: colors.disabled.bg,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  right: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
  },
  message: { ...typography.caption, color: colors.textMuted },
  messageError: { color: colors.feedback.danger.text },
});
