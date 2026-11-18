/**
 * Log singkat khusus pengembangan untuk error yang sudah diteruskan ke pemanggil (lewat `Result`
 * atau status sinkronisasi `error`). Tidak mencetak apa pun di build rilis.
 */
export function devWarn(scope: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[services/${scope}]`, error);
  }
}
