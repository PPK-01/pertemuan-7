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
