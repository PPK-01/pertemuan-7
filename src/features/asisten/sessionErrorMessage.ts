import { writeErrorMessage } from '@/features/asisten/writeErrorMessage';
import type { ErrorCode } from '@/types';

/** Aksi sesi asisten yang hasilnya dipetakan ke pesan Banner. */
export type SessionAction = 'create' | 'update' | 'delete' | 'status';

/** Transisi atau aksi sudah tidak berlaku karena status sesi berubah di perangkat lain. */
export const STATUS_CHANGED_MESSAGE = 'Status sesi sudah berubah. Periksa status terbaru di atas.';

/**
 * Pesan Banner untuk kode error `Result` dari aksi sesi store. Hanya kode yang maknanya
 * bergantung pada aksi sesi yang ditimpa di sini; sisanya memakai `writeErrorMessage`.
 */
export function sessionErrorMessage(code: ErrorCode, action: SessionAction): string {
  switch (code) {
    case 'TIMEOUT':
      // Buat sesi memakai id yang sama saat dikirim ulang, jadi mencoba lagi tidak membuat sesi
      // ganda; teks umum SRS §4.3 (mengajak coba lagi) berlaku untuk semua aksi sesi.
      return writeErrorMessage(code);
    case 'CONFLICT':
      // Untuk aksi pada sesi yang sudah ada, CONFLICT berasal dari pra-cek transisi status di store.
      return action === 'create' ? 'Terjadi kesalahan. Coba lagi.' : STATUS_CHANGED_MESSAGE;
    case 'NOT_FOUND':
      return action === 'create'
        ? 'Terjadi kesalahan. Coba lagi.'
        : 'Sesi tidak ditemukan. Mungkin sudah dihapus.';
    default:
      return writeErrorMessage(code);
  }
}
