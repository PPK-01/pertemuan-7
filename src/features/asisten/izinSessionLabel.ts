import type { SyncStatus } from '@/store/appStore';
import type { Session } from '@/types';
import { formatDate, formatTime } from '@/utils/time';

/** Nama praktikan pengganti bila userName di dokumen izin kosong. */
export const FALLBACK_PRAKTIKAN_NAME = 'Praktikan';

/** Daftar sesi sudah termuat tetapi sesi izin tidak ada: asisten melihat semua sesi, jadi sesinya dihapus. */
export const DELETED_SESSION_LABEL = 'Sesi sudah dihapus';

/** Listener sesi gagal: belum tentu sesinya dihapus. */
export const UNAVAILABLE_SESSION_LABEL = 'Sesi tidak dapat dimuat';

/** Label sementara selama listener sesi belum siap, agar tidak sempat tertulis "sudah dihapus". */
export const LOADING_SESSION_LABEL = 'Memuat sesi…';

/** 'deleted' hanya disimpulkan setelah daftar sesi termuat (pola sama dengan detail sesi). */
export type IzinSessionState = 'found' | 'loading' | 'deleted' | 'unavailable';

export function getIzinSessionState(
  session: Session | null | undefined,
  sessionsSync: SyncStatus,
): IzinSessionState {
  if (session) return 'found';
  if (sessionsSync === 'ready') return 'deleted';
  if (sessionsSync === 'error') return 'unavailable';
  return 'loading';
}

export function getPraktikanName(userName: string | undefined): string {
  const trimmed = userName?.trim();
  return trimmed ? trimmed : FALLBACK_PRAKTIKAN_NAME;
}

/**
 * Label sesi untuk IzinRow dan detail izin, mis. "Pemrograman Mobile · Kelas A · 17 Nov 2026, 09.00".
 * Tanggal dan jam memakai formatter yang sama dengan daftar sesi.
 */
export function getIzinSessionLabel(
  session: Session | null | undefined,
  sessionsSync: SyncStatus,
): string {
  if (session) {
    return `${session.praktikum} · Kelas ${session.kelas} · ${formatDate(session.startAt)}, ${formatTime(session.startAt)}`;
  }
  switch (getIzinSessionState(session, sessionsSync)) {
    case 'deleted':
      return DELETED_SESSION_LABEL;
    case 'unavailable':
      return UNAVAILABLE_SESSION_LABEL;
    default:
      return LOADING_SESSION_LABEL;
  }
}
