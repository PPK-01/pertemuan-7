import { listenKelas } from '@/services/kelas';
import { listenSessions } from '@/services/sessions';
import { listenAttendances } from '@/services/attendance';
import { listenIzin } from '@/services/izin';
import { listenPraktikan } from '@/services/users';
import type { Attendance, Izin, KelasPraktikum, Session, User } from '@/types';

export type SyncKey = 'sessions' | 'kelas' | 'attendances' | 'izin' | 'users';
export type SyncStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SyncStoreDelegate = {
  setSyncStatus: (key: SyncKey, status: SyncStatus) => void;
  getSyncStatus: (key: SyncKey) => SyncStatus;
  setKelasList: (list: KelasPraktikum[]) => void;
  setSessions: (sessions: Session[]) => void;
  setAttendances: (attendances: Attendance[]) => void;
  setIzinList: (izinList: Izin[]) => void;
  setUsers: (users: User[]) => void;
  retryAi: (izinId: string) => Promise<unknown>;
};

type UnsubscribeFn = () => void;
const activeUnsubscribers: Partial<Record<SyncKey, UnsubscribeFn>> = {};

// Deduplikasi eksekusi AI otomatis agar tidak berjalan berulang kali (I-4)
const inFlightAiRetries = new Set<string>();

let currentUserRef: User | null = null;
let currentDelegateRef: SyncStoreDelegate | null = null;

function startListener(key: SyncKey, user: User, delegate: SyncStoreDelegate) {
  // Hentikan listener lama jika ada
  if (activeUnsubscribers[key]) {
    try {
      activeUnsubscribers[key]!();
    } catch {
      // Abaikan error saat cleanup
    }
    delete activeUnsubscribers[key];
  }

  delegate.setSyncStatus(key, 'loading');

  switch (key) {
    case 'kelas': {
      const unsub = listenKelas(
        (kelasList) => {
          delegate.setKelasList(kelasList);
          delegate.setSyncStatus('kelas', 'ready');
        },
        () => {
          delegate.setSyncStatus('kelas', 'error');
        },
      );
      activeUnsubscribers.kelas = unsub;
      break;
    }

    case 'sessions': {
      const unsub = listenSessions(
        user,
        (sessions) => {
          delegate.setSessions(sessions);
          delegate.setSyncStatus('sessions', 'ready');
        },
        () => {
          delegate.setSyncStatus('sessions', 'error');
        },
      );
      activeUnsubscribers.sessions = unsub;
      break;
    }

    case 'attendances': {
      const unsub = listenAttendances(
        user,
        (attendances) => {
          delegate.setAttendances(attendances);
          delegate.setSyncStatus('attendances', 'ready');
        },
        () => {
          delegate.setSyncStatus('attendances', 'error');
        },
      );
      activeUnsubscribers.attendances = unsub;
      break;
    }

    case 'izin': {
      const unsub = listenIzin(
        user,
        (izinList) => {
          delegate.setIzinList(izinList);
          delegate.setSyncStatus('izin', 'ready');

          // FR-23: Jalankan AI jika ada izin berstatus pending_ai
          if (user.role === 'praktikan') {
            const pendingAiIzin = izinList.filter(
              (i) => i.userId === user.id && i.status === 'pending_ai',
            );
            pendingAiIzin.forEach((item) => {
              if (!inFlightAiRetries.has(item.id)) {
                inFlightAiRetries.add(item.id);
                delegate.retryAi(item.id).finally(() => {
                  inFlightAiRetries.delete(item.id);
                });
              }
            });
          }
        },
        () => {
          delegate.setSyncStatus('izin', 'error');
        },
      );
      activeUnsubscribers.izin = unsub;
      break;
    }

    case 'users': {
      if (user.role === 'asisten') {
        const unsub = listenPraktikan(
          (users) => {
            delegate.setUsers(users);
            delegate.setSyncStatus('users', 'ready');
          },
          () => {
            delegate.setSyncStatus('users', 'error');
          },
        );
        activeUnsubscribers.users = unsub;
      } else {
        delegate.setSyncStatus('users', 'ready');
      }
      break;
    }
  }
}

export function startSync(user: User, delegate: SyncStoreDelegate): void {
  stopSync(delegate);
  currentUserRef = user;
  currentDelegateRef = delegate;

  const keys: SyncKey[] = ['kelas', 'sessions', 'attendances', 'izin', 'users'];
  for (const k of keys) {
    startListener(k, user, delegate);
  }
}

export function stopSync(delegate?: SyncStoreDelegate): void {
  (Object.keys(activeUnsubscribers) as SyncKey[]).forEach((key) => {
    try {
      activeUnsubscribers[key]?.();
    } catch {
      // Abaikan error saat cleanup
    }
    delete activeUnsubscribers[key];
  });

  inFlightAiRetries.clear();

  const activeDelegate = delegate ?? currentDelegateRef;
  if (activeDelegate) {
    const keys: SyncKey[] = ['kelas', 'sessions', 'attendances', 'izin', 'users'];
    for (const k of keys) {
      activeDelegate.setSyncStatus(k, 'idle');
    }
  }
}

/**
 * Memasang ulang listener yang mengalami error sinkronisasi (C-4, NFR-02).
 * Jika key tidak ditentukan, semua listener yang berstatus error akan dipasang ulang.
 */
export function retrySync(
  key?: SyncKey,
  user?: User | null,
  delegate?: SyncStoreDelegate | null,
): void {
  const activeUser = user ?? currentUserRef;
  const activeDelegate = delegate ?? currentDelegateRef;
  if (!activeUser || !activeDelegate) return;

  if (key) {
    startListener(key, activeUser, activeDelegate);
  } else {
    const keys: SyncKey[] = ['kelas', 'sessions', 'attendances', 'izin', 'users'];
    for (const k of keys) {
      if (activeDelegate.getSyncStatus(k) === 'error') {
        startListener(k, activeUser, activeDelegate);
      }
    }
  }
}
