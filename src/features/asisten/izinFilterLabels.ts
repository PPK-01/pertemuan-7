import type { IzinStatus } from '@/types';

/** 'pending' = "Perlu diperiksa": pending_ai dan pending_review (FR-25). */
export type IzinFilter = 'pending' | 'approved' | 'rejected' | 'all';

/** Urutan chip sesuai FR-25; "Perlu diperiksa" menjadi default. */
export const IZIN_FILTER_LIST = ['pending', 'approved', 'rejected', 'all'] as const satisfies readonly IzinFilter[];

export const DEFAULT_IZIN_FILTER: IzinFilter = 'pending';

// Teks filter dari FR-25 SRS v2.2.
export const IZIN_FILTER_LABEL = {
  pending: 'Perlu diperiksa',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  all: 'Semua',
} as const satisfies Record<IzinFilter, string>;

/**
 * Status di luar approved/rejected (termasuk nilai tak dikenal dari Firestore, yang ditampilkan
 * IzinStatusBadge sebagai menunggu asisten) masuk "Perlu diperiksa" agar tidak hilang dari antrean.
 */
export function izinFilterOf(status: IzinStatus): Exclude<IzinFilter, 'all'> {
  if (status === 'approved' || status === 'rejected') return status;
  return 'pending';
}

// Pesan daftar kosong per filter; tidak ada teksnya di SRS v2.2.
export const IZIN_FILTER_EMPTY = {
  pending: 'Tidak ada izin yang perlu diperiksa',
  approved: 'Belum ada izin yang disetujui',
  rejected: 'Belum ada izin yang ditolak',
  all: 'Belum ada pengajuan izin',
} as const satisfies Record<IzinFilter, string>;

export const SHOW_ALL_IZIN_LABEL = 'Lihat semua izin';
