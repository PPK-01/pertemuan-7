import { DUPLICATE_KELAS_MESSAGE } from '@/features/asisten/kelasValidation';
import { writeErrorMessage } from '@/features/asisten/writeErrorMessage';
import type { ErrorCode } from '@/types';

export type KelasAction = 'create' | 'update' | 'delete';

/** Scope pesan sukses form kelas untuk daftar kelas (lihat flash.ts). */
export const KELAS_FLASH_SCOPE = 'kelas';

// FR-20: ubah dan hapus ditolak selama pasangan itu masih dipakai sesi mana pun, termasuk
// sesi yang sudah ditutup (rekapnya bergantung pada pasangan tersebut).
export const KELAS_IN_USE_MESSAGE: Record<Exclude<KelasAction, 'create'>, string> = {
  update: 'Kelas ini masih dipakai sesi praktikum, jadi belum bisa diubah.',
  delete: 'Kelas ini masih dipakai sesi praktikum, jadi belum bisa dihapus.',
};

const KELAS_NOT_FOUND_MESSAGE = 'Kelas tidak ditemukan. Mungkin sudah dihapus.';

/**
 * Pesan Banner untuk kode error `Result` dari aksi kelas store. services/kelas memakai
 * DUPLICATE untuk pasangan yang sudah ada dan IN_USE untuk kelas yang masih dipakai sesi.
 */
export function kelasErrorMessage(code: ErrorCode, action: KelasAction): string {
  switch (code) {
    case 'DUPLICATE':
      return DUPLICATE_KELAS_MESSAGE;
    case 'IN_USE':
      return action === 'delete' ? KELAS_IN_USE_MESSAGE.delete : KELAS_IN_USE_MESSAGE.update;
    case 'NOT_FOUND':
      return KELAS_NOT_FOUND_MESSAGE;
    default:
      return writeErrorMessage(code);
  }
}
