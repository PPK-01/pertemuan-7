import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export type BannerProps = {
  /** Dipetakan ke colors.feedback. */
  tone: 'success' | 'danger' | 'info';
  message: string;
  title?: string;
  /** Khusus layout (margin, flex, alignSelf), bukan warna/ukuran. */
  style?: StyleProp<ViewStyle>;
};

// Garis tepi tipis sama dengan Card; belum ada token lebar garis.
const BORDER_WIDTH = 1;

const IS_WEB = Platform.OS === 'web';

/**
 * Banner danger (gagal simpan, validasi) diumumkan ke pembaca layar tanpa perlu difokus.
 *
 * Web: role="alert" sudah dibacakan browser. Android/iOS: role="alert" tidak dibacakan
 * otomatis, dan aria-live hanya berlaku di Android serta diam saat Banner baru di-mount,
 * padahal Banner danger biasanya muncul bersamaan dengan pesannya. Karena itu native memakai
 * announceForAccessibility, dan Banner danger tidak memakai aria-live agar tidak dibaca dua kali.
 */
function useAnnounceAlert(enabled: boolean, announcement: string) {
  // Ref bertahan saat rerender, sehingga pesan yang sama tidak diumumkan ulang.
  // Pemanggil yang memberi key baru per kegagalan membuat Banner baru, jadi tetap diumumkan.
  const lastAnnounced = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || IS_WEB || lastAnnounced.current === announcement) return;
    lastAnnounced.current = announcement;
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [enabled, announcement]);
}

export function Banner({ tone, message, title, style }: BannerProps) {
  const { bg, text } = colors.feedback[tone];
  const isAlert = tone === 'danger';
  useAnnounceAlert(isAlert, title ? `${title}. ${message}` : message);

  return (
    // info/success: aria-live="polite" membacakan perubahan pesan tanpa memotong bacaan lain,
    // dan tidak membacakan Banner statis saat layar dibuka.
    <View
      role={isAlert ? 'alert' : undefined}
      aria-live={isAlert ? undefined : 'polite'}
      style={[
        styles.container,
        { backgroundColor: bg, borderColor: text },
        style,
      ]}
    >
      {title ? <Text style={[styles.title, { color: text }]}>{title}</Text> : null}
      <Text style={[styles.message, { color: text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: BORDER_WIDTH,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: typography.label,
  message: typography.body,
});
