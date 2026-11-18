import { useCallback, useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  dummyAttendances,
  dummyIzin,
  dummyKelasPraktikum,
  dummySessions,
  dummyUsers,
} from '@/data/dummy';
import {
  login as authLogin,
  logout as authLogout,
  observeAuth as authObserveAuth,
  register as authRegister,
} from '@/services/auth';
import {
  addKelas as svcAddKelas,
  deleteKelas as svcDeleteKelas,
  updateKelas as svcUpdateKelas,
} from '@/services/kelas';
import {
  createSession as svcCreateSession,
  deleteSession as svcDeleteSession,
  getSessionCode as svcGetSessionCode,
  newSessionId as svcNewSessionId,
  setStatus as svcSetStatus,
  updateSession as svcUpdateSession,
} from '@/services/sessions';
import { submitAttendance as svcSubmitAttendance } from '@/services/attendance';
import {
  reviewIzin as svcReviewIzin,
  saveAiResult as svcSaveAiResult,
  submitIzin as svcSubmitIzin,
} from '@/services/izin';
import { classifyIzin } from '@/services/ai';
import { connectionService } from '@/services/connection';
import { isFirebaseReady } from '@/services/firebase';
import { withWriteGuard } from '@/services/guard';
import {
  retrySync as syncRetrySync,
  startSync as syncStartSync,
  stopSync as syncStopSync,
  type SyncKey,
  type SyncStatus,
  type SyncStoreDelegate,
} from './sync';
import type {
  Attendance,
  AttendResult,
  CreateSessionInput,
  Izin,
  IzinStatus,
  KelasPraktikum,
  RegisterInput,
  Rekap,
  Result,
  Role,
  Session,
  User,
} from '@/types';

export type { SyncKey, SyncStatus };

const IDLE_SYNC: Record<SyncKey, SyncStatus> = {
  sessions: 'idle',
  kelas: 'idle',
  attendances: 'idle',
  izin: 'idle',
  users: 'idle',
};

export type AppStoreState = {
  authStatus: 'loading' | 'signedOut' | 'signedIn';
  currentUser: User | null;
  isOnline: boolean;
  sync: Record<SyncKey, SyncStatus>;

  users: User[];
  kelasList: KelasPraktikum[];
  sessions: Session[];
  attendances: Attendance[];
  izinList: Izin[];
  sessionCodes: Record<string, string>;

  // Internal setters
  setCurrentUser: (user: User | null) => void;
  setAuthStatus: (status: 'loading' | 'signedOut' | 'signedIn') => void;
  setSyncStatus: (key: SyncKey, status: SyncStatus) => void;
  setSessionCode: (sessionId: string, code: string) => void;

  // Aksi Auth (FR-01, FR-13 s.d. FR-15)
  initAuth: () => () => void;
  register: (input: RegisterInput) => Promise<Result<User>>;
  login: (email: string, password: string) => Promise<Result<User>>;
  logout: () => Promise<void>;

  // Sinkronisasi (C-4, NFR-02)
  retrySync: (key?: SyncKey) => void;

  // Aksi Sesi & Kelas (FR-04 s.d. FR-06, FR-18 s.d. FR-20, SRS v2.2 §3.4)
  /** Id sesi baru tanpa menulis; simpan lalu kirim ke createSession agar kirim ulang aman. */
  newSessionId: () => string;
  /**
   * Membuat sesi. Dengan `options.id`, sesi yang sudah ada dengan id itu dikembalikan sebagai
   * sukses tanpa menulis ulang, sehingga kirim ulang setelah gagal atau TIMEOUT tidak membuat
   * sesi ganda. Tanpa `options.id`, id baru dibuat setiap pemanggilan.
   */
  createSession: (
    input: CreateSessionInput,
    options?: { id?: string },
  ) => Promise<Result<Session>>;
  updateSession: (id: string, patch: Partial<Session>) => Promise<Result>;
  deleteSession: (id: string) => Promise<Result>;
  openSession: (id: string) => Promise<Result>;
  closeSession: (id: string) => Promise<Result>;
  addKelas: (praktikum: string, kelas: string) => Promise<Result<KelasPraktikum>>;
  updateKelas: (id: string, praktikum: string, kelas: string) => Promise<Result>;
  deleteKelas: (id: string) => Promise<Result>;

  // Aksi Presensi & Izin (FR-07, FR-21 s.d. FR-24, FR-26)
  submitAttendance: (sessionId: string, code: string) => Promise<AttendResult>;
  submitIzin: (sessionId: string, alasan: string) => Promise<Result<Izin>>;
  retryAi: (izinId: string) => Promise<Result>;
  reviewIzin: (
    izinId: string,
    keputusan: 'approved' | 'rejected',
    catatan?: string,
  ) => Promise<Result>;
};

// Delegate sync adapter untuk memutus require-cycle antara appStore dan sync
function getSyncDelegate(get: () => AppStoreState, set: (partial: Partial<AppStoreState> | ((state: AppStoreState) => Partial<AppStoreState>)) => void): SyncStoreDelegate {
  return {
    setSyncStatus: (key, status) => {
      set((state) => ({ sync: { ...state.sync, [key]: status } }));
    },
    getSyncStatus: (key) => get().sync[key],
    setKelasList: (kelasList) => set({ kelasList }),
    setSessions: (sessions) => set({ sessions }),
    setAttendances: (attendances) => set({ attendances }),
    setIzinList: (izinList) => set({ izinList }),
    setUsers: (users) => set({ users }),
    retryAi: (izinId) => get().retryAi(izinId),
  };
}

export const useAppStore = create<AppStoreState>()((set, get) => ({
  authStatus: 'loading',
  currentUser: null,
  isOnline: connectionService.isConnected,
  sync: IDLE_SYNC,

  // State awal: jika Firebase aktif, mulai dengan data kosong (O-4). Jika fallback in-memory, muat dummy data.
  users: isFirebaseReady ? [] : dummyUsers,
  kelasList: isFirebaseReady ? [] : dummyKelasPraktikum,
  sessions: isFirebaseReady ? [] : dummySessions,
  attendances: isFirebaseReady ? [] : dummyAttendances,
  izinList: isFirebaseReady ? [] : dummyIzin,
  sessionCodes: {},

  setCurrentUser: (user) => {
    set({
      currentUser: user,
      authStatus: user ? 'signedIn' : 'signedOut',
    });
    if (user) {
      syncStartSync(user, getSyncDelegate(get, set));
    } else {
      syncStopSync(getSyncDelegate(get, set));
      // Seluruh cache dikosongkan agar akun berikutnya di perangkat yang sama tidak melihat data
      // akun sebelumnya (mis. daftar praktikan atau kode sesi milik asisten).
      set({
        sync: IDLE_SYNC,
        users: isFirebaseReady ? [] : dummyUsers,
        kelasList: isFirebaseReady ? [] : dummyKelasPraktikum,
        sessions: isFirebaseReady ? [] : dummySessions,
        attendances: isFirebaseReady ? [] : dummyAttendances,
        izinList: isFirebaseReady ? [] : dummyIzin,
        sessionCodes: {},
      });
    }
  },

  setAuthStatus: (authStatus) => set({ authStatus }),

  setSyncStatus: (key, status) => {
    set((state) => ({
      sync: { ...state.sync, [key]: status },
    }));
  },

  setSessionCode: (sessionId, code) => {
    set((state) => ({
      sessionCodes: { ...state.sessionCodes, [sessionId]: code },
    }));
  },

  initAuth: () => {
    return authObserveAuth((user) => {
      get().setCurrentUser(user);
    });
  },

  retrySync: (key) => {
    const user = get().currentUser;
    if (user) {
      syncRetrySync(key, user, getSyncDelegate(get, set));
    }
  },

  register: async (input) => {
    const res = await authRegister(input);
    if (res.ok) {
      get().setCurrentUser(res.data);
    }
    return res;
  },

  login: async (email, password) => {
    const res = await authLogin(email, password);
    if (res.ok) {
      get().setCurrentUser(res.data);
    }
    return res;
  },

  logout: async () => {
    await authLogout();
    get().setCurrentUser(null);
  },

  newSessionId: () => svcNewSessionId(),

  createSession: async (input, options) => {
    // C-2: Sesi dibuat dengan id final Firestore yang konsisten sejak awal. Tanpa options.id,
    // service membuat id baru seperti sebelumnya.
    const id = options?.id;
    if (id) {
      // Kirim ulang dengan id yang sama dan sesinya sudah tersinkron: tidak perlu menulis lagi.
      const cached = get().sessions.find((s) => s.id === id);
      if (cached) {
        return { ok: true, data: cached };
      }
    }
    // Dengan id, service membaca dokumen lebih dulu untuk tulis yang sudah tersimpan tetapi
    // belum sampai ke cache.
    return withWriteGuard(() => svcCreateSession({ ...input, id }));
  },

  updateSession: async (id, patch) => {
    return withWriteGuard(() => svcUpdateSession(id, patch));
  },

  deleteSession: async (id) => {
    return withWriteGuard(() => svcDeleteSession(id));
  },

  openSession: async (id) => {
    // C-5: Pra-cek transisi status sesi terkini di store
    const session = get().sessions.find((s) => s.id === id);
    if (session && session.status !== 'scheduled') {
      return {
        ok: false,
        code: 'CONFLICT',
        message:
          session.status === 'open'
            ? 'Sesi sudah dibuka'
            : 'Sesi sudah ditutup dan tidak dapat dibuka kembali',
      };
    }
    return withWriteGuard(() => svcSetStatus(id, 'open'));
  },

  closeSession: async (id) => {
    // C-5: Pra-cek transisi status sesi terkini di store
    const session = get().sessions.find((s) => s.id === id);
    if (session && session.status !== 'open') {
      return {
        ok: false,
        code: 'CONFLICT',
        message:
          session.status === 'closed'
            ? 'Sesi sudah ditutup'
            : 'Sesi belum dibuka',
      };
    }
    return withWriteGuard(() => svcSetStatus(id, 'closed'));
  },

  addKelas: async (praktikum, kelas) => {
    const user = get().currentUser;
    return withWriteGuard(() => svcAddKelas(praktikum, kelas, user?.id ?? ''));
  },

  updateKelas: async (id, praktikum, kelas) => {
    return withWriteGuard(() => svcUpdateKelas(id, praktikum, kelas));
  },

  deleteKelas: async (id) => {
    return withWriteGuard(() => svcDeleteKelas(id));
  },

  submitAttendance: async (sessionId, code) => {
    const user = get().currentUser;
    if (!user) {
      return { ok: false, reason: 'UNKNOWN' };
    }

    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) {
      return { ok: false, reason: 'SESSION_NOT_OPEN' };
    }

    // Cek apakah izin sudah disetujui (FR-28)
    const approvedIzin = get().izinList.some(
      (i) => i.sessionId === sessionId && i.userId === user.id && i.status === 'approved',
    );
    if (approvedIzin) {
      return { ok: false, reason: 'IZIN_APPROVED' };
    }

    // Pra-cek lokal sudah presensi
    const alreadyAttended = get().attendances.some(
      (a) => a.sessionId === sessionId && a.userId === user.id,
    );
    if (alreadyAttended) {
      return { ok: false, reason: 'ALREADY_ATTENDED' };
    }

    return svcSubmitAttendance(sessionId, user, code, session);
  },

  submitIzin: async (sessionId, alasan) => {
    const user = get().currentUser;
    if (!user) {
      return { ok: false, code: 'PERMISSION_DENIED', message: 'Harap masuk terlebih dahulu' };
    }

    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) {
      return { ok: false, code: 'NOT_FOUND', message: 'Sesi tidak ditemukan' };
    }

    return withWriteGuard(() => svcSubmitIzin(sessionId, user, alasan, session));
  },

  retryAi: async (izinId) => {
    const izin = get().izinList.find((i) => i.id === izinId);
    if (!izin) {
      return { ok: false, code: 'NOT_FOUND', message: 'Pengajuan izin tidak ditemukan' };
    }

    return withWriteGuard(async () => {
      const aiResult = await classifyIzin(izin.alasan);
      return svcSaveAiResult(izinId, aiResult);
    });
  },

  reviewIzin: async (izinId, keputusan, catatan) => {
    const user = get().currentUser;
    return withWriteGuard(() =>
      svcReviewIzin(izinId, user?.id ?? '', keputusan, catatan),
    );
  },
}));

// O-3 & FR-29: Pasang pemantauan status koneksi secara global dan pasang ulang otomatis listener yang error saat kembali online
connectionService.subscribe((isConnected) => {
  useAppStore.setState({ isOnline: isConnected });
  if (isConnected) {
    const store = useAppStore.getState();
    const user = store.currentUser;
    if (user) {
      (Object.keys(store.sync) as SyncKey[]).forEach((key) => {
        if (store.sync[key] === 'error') {
          store.retrySync(key);
        }
      });
    }
  }
});

// ===== Fungsi Murni Rekapitulasi (FR-10, FR-28) =====

export function computeRekap(
  session: Session,
  users: User[],
  attendances: Attendance[],
  izinList: Izin[],
): Rekap {
  // Hanya praktikan di kelas sesi
  const praktikan = users.filter(
    (user) => user.role === 'praktikan' && user.kelas === session.kelas,
  );

  // 1. Hadir (urut waktu paling awal)
  const attendanceByUser = new Map<string, Attendance>();
  for (const att of attendances) {
    if (att.sessionId === session.id && !attendanceByUser.has(att.userId)) {
      attendanceByUser.set(att.userId, att);
    }
  }

  const hadir = praktikan
    .flatMap((user) => {
      const att = attendanceByUser.get(user.id);
      return att ? [{ user, timestamp: att.timestamp }] : [];
    })
    .sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? ''));

  const hadirIds = new Set(hadir.map((h) => h.user.id));

  // 2. Izin (hanya status 'approved', urut nama)
  const approvedIzinMap = new Map<string, Izin>();
  for (const iz of izinList) {
    if (iz.sessionId === session.id && iz.status === 'approved') {
      approvedIzinMap.set(iz.userId, iz);
    }
  }

  const izin = praktikan
    .flatMap((user) => {
      const iz = approvedIzinMap.get(user.id);
      return iz ? [{ user, izin: iz }] : [];
    })
    .sort((a, b) => a.user.name.localeCompare(b.user.name, 'id'));

  const izinApprovedIds = new Set(izin.map((i) => i.user.id));

  // 3. Belum Hadir (tidak hadir dan tidak berizin disetujui, urut nama)
  const belumHadir = praktikan
    .filter((user) => !hadirIds.has(user.id) && !izinApprovedIds.has(user.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));

  return {
    total: praktikan.length,
    hadir,
    izin,
    belumHadir,
  };
}

// ===== Hook Baca Store =====

export function useCurrentUser(): User | null {
  return useAppStore((state) => state.currentUser);
}

export function useAuthStatus(): 'loading' | 'signedOut' | 'signedIn' {
  return useAppStore((state) => state.authStatus);
}

export function useIsOnline(): boolean {
  return useAppStore((state) => state.isOnline);
}

export function useSyncState(key: SyncKey): SyncStatus {
  return useAppStore((state) => state.sync[key]);
}

export function useKelasList(): KelasPraktikum[] {
  return useAppStore((state) => state.kelasList);
}

export function useSessionsForUser(userId: string): Session[] {
  return useAppStore(
    useShallow((state) => {
      const user = state.currentUser?.id === userId ? state.currentUser : state.users.find((u) => u.id === userId);
      if (!user) return [];

      const visible =
        user.role === 'asisten'
          ? state.sessions
          : state.sessions.filter((s) => s.kelas === user.kelas);

      return [...visible].sort((a, b) => a.startAt.localeCompare(b.startAt));
    }),
  );
}

export function useSessionById(id: string): Session | null {
  return useAppStore((state) => state.sessions.find((s) => s.id === id) ?? null);
}

export type SessionCodeStatus = 'loading' | 'ready' | 'error';

export type SessionCodeState = {
  code: string | null;
  status: SessionCodeStatus;
  /** Membaca ulang kode setelah status 'error'. */
  retry: () => void;
};

/**
 * Hook khusus asisten untuk membaca kode sesi 4 digit secara reaktif (C-3, SRS v2.2 §3.4).
 * Kode yang berhasil dibaca disimpan di store; gagal baca menghasilkan status 'error' yang bisa
 * dicoba lagi lewat `retry`. Objek hasil stabil selama code dan status tidak berubah.
 */
export function useSessionCode(sessionId?: string): SessionCodeState {
  const codeInStore = useAppStore((state) =>
    sessionId ? state.sessionCodes[sessionId] : undefined,
  );
  const setSessionCode = useAppStore((state) => state.setSessionCode);
  const role = useAppStore((state) => state.currentUser?.role);
  // sessionId terakhir yang gagal dibaca; berganti sesi otomatis kembali ke 'loading'.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Pindah sesi membuang status gagal lama (penyesuaian state saat render, pola React resmi),
  // agar kembali ke sesi yang tadinya gagal tampil 'loading' selama dibaca ulang.
  const [prevSessionId, setPrevSessionId] = useState(sessionId);
  if (prevSessionId !== sessionId) {
    setPrevSessionId(sessionId);
    setFailedFor(null);
  }

  useEffect(() => {
    if (!sessionId || role !== 'asisten' || codeInStore !== undefined) {
      return;
    }
    let isMounted = true;
    svcGetSessionCode(sessionId).then((res) => {
      if (!isMounted) return;
      if (res.ok) {
        setSessionCode(sessionId, res.data);
      } else {
        setFailedFor(sessionId);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [sessionId, role, codeInStore, setSessionCode, attempt]);

  const retry = useCallback(() => {
    setFailedFor(null);
    setAttempt((n) => n + 1);
  }, []);

  const status: SessionCodeStatus =
    codeInStore !== undefined
      ? 'ready'
      : sessionId !== undefined && failedFor === sessionId
        ? 'error'
        : 'loading';
  const code = codeInStore ?? null;

  return useMemo(() => ({ code, status, retry }), [code, status, retry]);
}

export function useAttendanceBySession(sessionId: string): Attendance[] {
  return useAppStore(
    useShallow((state) => state.attendances.filter((a) => a.sessionId === sessionId)),
  );
}

export function useAttendanceByUser(userId: string): Attendance[] {
  return useAppStore(
    useShallow((state) => state.attendances.filter((a) => a.userId === userId)),
  );
}

export function useHasAttended(sessionId: string, userId: string): boolean {
  return useAppStore((state) =>
    state.attendances.some((a) => a.sessionId === sessionId && a.userId === userId),
  );
}

export function useRekap(sessionId: string): Rekap | null {
  const session = useSessionById(sessionId);
  const users = useAppStore((state) => state.users);
  const attendances = useAppStore((state) => state.attendances);
  const izinList = useAppStore((state) => state.izinList);

  return useMemo(
    () => (session ? computeRekap(session, users, attendances, izinList) : null),
    [session, users, attendances, izinList],
  );
}

export function useIzinByUser(userId: string): Izin[] {
  return useAppStore(
    useShallow((state) =>
      state.izinList
        .filter((i) => i.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  );
}

export function useIzinById(id: string): Izin | null {
  return useAppStore((state) => state.izinList.find((i) => i.id === id) ?? null);
}

export function useIzinBySession(sessionId: string): Izin[] {
  return useAppStore(
    useShallow((state) =>
      state.izinList
        .filter((i) => i.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  );
}

/**
 * Hook membaca daftar izin asisten (C-7, FR-25).
 * Mendukung filter spesifik status, 'all', atau 'pending' ('pending_ai' + 'pending_review').
 */
export function useIzinForAsisten(filter?: IzinStatus | 'all' | 'pending'): Izin[] {
  return useAppStore(
    useShallow((state) => {
      let list = state.izinList;
      if (filter === 'pending') {
        list = list.filter((i) => i.status === 'pending_ai' || i.status === 'pending_review');
      } else if (filter && filter !== 'all') {
        list = list.filter((i) => i.status === filter);
      }
      return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }),
  );
}

export async function fetchSessionCode(sessionId: string): Promise<string | null> {
  const res = await svcGetSessionCode(sessionId);
  return res.ok ? res.data : null;
}
