import type { ErrorCode } from '@/types';

/** Aksi sesi asisten yang hasilnya dipetakan ke pesan Banner. */
export type SessionAction = 'create' | 'update' | 'delete' | 'status';

/** Transisi atau aksi sudah tidak berlaku karena status sesi berubah di perangkat lain. */
export const STATUS_CHANGED_MESSAGE = 'Status sesi sudah berubah. Periksa status terbaru di atas.';

/** Keterangan di bawah tombol tulis yang dinonaktifkan saat offline (FR-29). */
export const OFFLINE_ACTION_HINT = 'Tidak ada koneksi internet. Aksi ini aktif lagi setelah tersambung.';

/**
 * Pesan Banner untuk kode error `Result` dari aksi sesi store. Teks mengikuti SRS §4.3.
 * Switch exhaustive: kode baru di `ErrorCode` membuat `tsc` gagal sampai dipetakan di sini.
 */
export function sessionErrorMessage(code: ErrorCode, action: SessionAction): string {
  switch (code) {
    case 'NO_CONNECTION':
      return 'Tidak ada koneksi internet.';
    case 'TIMEOUT':
      // Batch yang melewati batas waktu masih bisa tersimpan kemudian, dan setiap kirim ulang
      // membuat id sesi baru; asisten diminta memeriksa daftar agar tidak ada sesi ganda.
      return action === 'create'
        ? 'Sesi belum dapat dipastikan tersimpan. Cek daftar sesi sebelum mencoba lagi.'
        : 'Permintaan terlalu lama. Periksa koneksi lalu coba lagi.';
    case 'PERMISSION_DENIED':
      return 'Kamu tidak memiliki izin untuk aksi ini.';
    case 'CONFLICT':
      // Untuk aksi pada sesi yang sudah ada, CONFLICT berasal dari pra-cek transisi status di store.
      return action === 'create' ? 'Terjadi kesalahan. Coba lagi.' : STATUS_CHANGED_MESSAGE;
    case 'NOT_FOUND':
      return action === 'create'
        ? 'Terjadi kesalahan. Coba lagi.'
        : 'Sesi tidak ditemukan. Mungkin sudah dihapus.';
    case 'INVALID_INPUT':
    case 'UNKNOWN':
      return 'Terjadi kesalahan. Coba lagi.';
    default: {
      const unhandled: never = code;
      return unhandled;
    }
  }
}
