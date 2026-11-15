import type { Session } from '@/types';
import { formatDate, formatTime } from '@/utils/time';

/** Nama praktikan pengganti bila userName di dokumen izin kosong. */
export const FALLBACK_PRAKTIKAN_NAME = 'Praktikan';

/** Label pengganti bila sesi izin sudah dihapus atau tidak terlihat oleh asisten. */
export const MISSING_SESSION_LABEL = 'Sesi tidak tersedia';

/** Label sementara selama listener sesi belum siap, agar tidak sempat tertulis "tidak tersedia". */
export const LOADING_SESSION_LABEL = 'Memuat sesi…';

export function getPraktikanName(userName: string | undefined): string {
  const trimmed = userName?.trim();
  return trimmed ? trimmed : FALLBACK_PRAKTIKAN_NAME;
}

/**
 * Label sesi untuk IzinRow dan detail izin, mis. "Pemrograman Mobile · Kelas A · 17 Nov 2026, 09.00".
 * Tanggal dan jam memakai formatter yang sama dengan daftar sesi.
 */
export function getIzinSessionLabel(session: Session | undefined, sessionsLoading = false): string {
  if (!session) return sessionsLoading ? LOADING_SESSION_LABEL : MISSING_SESSION_LABEL;
  return `${session.praktikum} · Kelas ${session.kelas} · ${formatDate(session.startAt)}, ${formatTime(session.startAt)}`;
}
