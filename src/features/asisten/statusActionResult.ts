import type { ErrorCode, Result } from '@/types';

export type StatusActionOutcome =
  | { kind: 'success' }
  | { kind: 'stale' }
  | { kind: 'error'; message: string };

// Transisi status yang tidak lagi sesuai ditolak rules (permission-denied), atau sesi sudah
// tidak ada / sudah diproses. Ketiganya berarti tampilan asisten tertinggal dari status terkini.
const STALE_CODES: readonly ErrorCode[] = ['CONFLICT', 'NOT_FOUND', 'PERMISSION_DENIED'];

/**
 * Membaca hasil openSession/closeSession tanpa mengubah cara aksi dipanggil.
 * Kembalian `false` (implementasi sinkron) diperlakukan sebagai status sudah berubah.
 */
export async function readStatusActionResult(
  result: Promise<Result> | boolean,
): Promise<StatusActionOutcome> {
  if (typeof result === 'boolean') {
    return result ? { kind: 'success' } : { kind: 'stale' };
  }
  const res = await result;
  if (res.ok) return { kind: 'success' };
  if (STALE_CODES.includes(res.code)) return { kind: 'stale' };
  return { kind: 'error', message: res.message };
}
