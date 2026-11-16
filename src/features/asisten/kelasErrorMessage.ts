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
const UPDATE_CONFLICT_MESSAGE =
  'Kelas ini masih dipakai sesi praktikum atau pasangan praktikum dan kelas sudah ada.';

/**
 * Konteks dari cache store saat Result gagal diterima. services/kelas memakai CONFLICT untuk
 * "masih dipakai sesi" dan "pasangan sudah ada", jadi keduanya dibedakan dari cache.
 */
export type KelasConflictContext = { inUse: boolean; duplicate: boolean };

export function kelasErrorMessage(
  code: ErrorCode,
  action: KelasAction,
  context: KelasConflictContext,
): string {
  switch (code) {
    case 'CONFLICT':
      if (action === 'create') return DUPLICATE_KELAS_MESSAGE;
      if (action === 'delete') return KELAS_IN_USE_MESSAGE.delete;
      if (context.inUse) return KELAS_IN_USE_MESSAGE.update;
      if (context.duplicate) return DUPLICATE_KELAS_MESSAGE;
      return UPDATE_CONFLICT_MESSAGE;
    case 'NOT_FOUND':
      return KELAS_NOT_FOUND_MESSAGE;
    default:
      return writeErrorMessage(code);
  }
}
