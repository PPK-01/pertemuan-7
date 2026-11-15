import { router } from 'expo-router';

/**
 * Kembali ke layar sebelumnya, atau ke daftar sesi asisten bila tidak ada riwayat.
 * Deep link langsung ke layar asisten tidak punya riwayat; tanpa fallback tombol kembali
 * diam atau keluar dari aplikasi.
 */
export function goBackToList(): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/asisten');
  }
}
