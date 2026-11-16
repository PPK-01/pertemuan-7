import { writeErrorMessage } from '@/features/asisten/writeErrorMessage';
import type { ErrorCode } from '@/types';

/** Izin sudah diputuskan asisten lain atau di perangkat lain; status akhir tidak dapat diubah. */
export const IZIN_ALREADY_REVIEWED_MESSAGE =
  'Izin ini sudah diperiksa. Lihat keputusan terbaru di halaman ini.';

/**
 * Pesan Banner untuk kode error `Result` dari `reviewIzin`. Hanya kode yang maknanya khusus
 * pemeriksaan izin yang ditimpa; sisanya memakai `writeErrorMessage`.
 */
export function izinReviewErrorMessage(code: ErrorCode): string {
  switch (code) {
    case 'CONFLICT':
      return IZIN_ALREADY_REVIEWED_MESSAGE;
    case 'NOT_FOUND':
      return 'Izin tidak ditemukan. Mungkin sudah dihapus.';
    default:
      return writeErrorMessage(code);
  }
}
