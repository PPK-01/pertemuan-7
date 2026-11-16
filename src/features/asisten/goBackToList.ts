import { router } from 'expo-router';
import type { Href } from 'expo-router';

/**
 * Kembali ke layar sebelumnya, atau ke `fallback` bila tidak ada riwayat.
 * Deep link langsung ke layar asisten tidak punya riwayat; tanpa fallback tombol kembali
 * diam atau keluar dari aplikasi.
 */
function goBackOr(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}

/** Fallback ke daftar sesi asisten (beranda asisten). */
export function goBackToList(): void {
  goBackOr('/asisten');
}

/** Fallback ke daftar izin, untuk detail izin yang dibuka lewat deep link. */
export function goBackToIzinList(): void {
  goBackOr('/asisten/izin');
}
