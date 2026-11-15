import { STATUS_LABEL } from '@/components/session/statusLabel';
import { SESSION_STATUS_LIST } from '@/types';
import type { SessionStatus } from '@/types';

export type SessionFilter = SessionStatus | 'all';

export const SESSION_FILTER_LIST = ['all', ...SESSION_STATUS_LIST] as const satisfies readonly SessionFilter[];

// Label status diambil dari STATUS_LABEL agar chip filter dan StatusBadge selalu sama.
export const SESSION_FILTER_LABEL = {
  all: 'Semua',
  ...STATUS_LABEL,
} as const satisfies Record<SessionFilter, string>;

// Pesan daftar kosong per filter; tidak ada teksnya di SRS v2.2.
export const SESSION_FILTER_EMPTY = {
  all: { title: 'Belum ada sesi', message: 'Buat sesi pertama dengan tombol "Buat sesi".' },
  scheduled: { title: 'Tidak ada sesi terjadwal' },
  open: { title: 'Tidak ada sesi yang sedang dibuka' },
  closed: { title: 'Belum ada sesi yang ditutup' },
} as const satisfies Record<SessionFilter, { title: string; message?: string }>;

export const SHOW_ALL_SESSIONS_LABEL = 'Lihat semua sesi';
