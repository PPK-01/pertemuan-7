import { DUPLICATE_KELAS_MESSAGE } from '@/features/asisten/kelasValidation';
import type { ErrorCode } from '@/types';

/** Keterangan di bawah tombol tulis yang dinonaktifkan saat offline (FR-29). */
export const OFFLINE_ACTION_HINT = 'Tidak ada koneksi internet. Aksi ini aktif lagi setelah tersambung.';

/**
 * Pesan Banner umum untuk kode error `Result` dari aksi tulis store di area asisten.
 * Teks mengikuti SRS §4.3. Pemetaan khusus per fitur (mis. `sessionErrorMessage`) menimpa
 * kode yang maknanya bergantung pada aksi, lalu jatuh ke fungsi ini untuk sisanya.
 * Switch exhaustive: kode baru di `ErrorCode` membuat `tsc` gagal sampai dipetakan di sini.
 */
export function writeErrorMessage(code: ErrorCode): string {
  switch (code) {
    case 'NO_CONNECTION':
      return 'Tidak ada koneksi internet.';
    case 'TIMEOUT':
      return 'Permintaan terlalu lama. Periksa koneksi lalu coba lagi.';
    case 'PERMISSION_DENIED':
      return 'Kamu tidak memiliki izin untuk aksi ini.';
    case 'NOT_FOUND':
      return 'Data tidak ditemukan. Mungkin sudah dihapus.';
    case 'CONFLICT':
      return 'Data sudah berubah. Periksa data terbaru lalu coba lagi.';
    case 'DUPLICATE':
      // Saat ini hanya dipakai pasangan praktikum dan kelas (services/kelas).
      return DUPLICATE_KELAS_MESSAGE;
    case 'IN_USE':
      return 'Kelas ini masih dipakai sesi praktikum, jadi belum bisa diubah atau dihapus.';
    case 'INVALID_INPUT':
    case 'UNKNOWN':
      return 'Terjadi kesalahan. Coba lagi.';
    default: {
      const unhandled: never = code;
      return unhandled;
    }
  }
}
