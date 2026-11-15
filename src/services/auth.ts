import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from './firebase';
import { getUserProfile, setFallbackUsers, getFallbackUsers } from './users';
import { mapFirebaseError } from './errors';
import { safeStorage } from './storage';
import type { RegisterInput, Result, User } from '@/types';
import { createId } from '@/utils/id';

const FALLBACK_AUTH_KEY = '@rawuh_fallback_current_user_id';

let fallbackCurrentUser: User | null = null;
const fallbackAuthListeners = new Set<(user: User | null) => void>();

// Penanda proses registrasi untuk mencegah race condition pada observeAuth (A-1, FR-16)
let isRegistering = false;

export async function register(input: RegisterInput): Promise<Result<User>> {
  if (!isFirebaseReady || !auth || !db) {
    // Mode Fallback
    const existing = getFallbackUsers().find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) {
      return { ok: false, code: 'CONFLICT', message: 'Email sudah terdaftar' };
    }

    // FR-13 / §6.1: Kode undangan tidak boleh di-hardcode ke rahasia tertentu di kode aplikasi
    if (input.role === 'asisten' && !input.inviteCode?.trim()) {
      return { ok: false, code: 'PERMISSION_DENIED', message: 'Kode undangan asisten tidak sesuai' };
    }

    const newUser: User = {
      id: createId('usr'),
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role,
      kelas: input.role === 'praktikan' ? input.kelas : undefined,
    };

    const updated = [...getFallbackUsers(), newUser];
    setFallbackUsers(updated);
    fallbackCurrentUser = newUser;
    await safeStorage.setItem(FALLBACK_AUTH_KEY, newUser.id);
    notifyFallbackAuth(newUser);

    return { ok: true, data: newUser };
  }

  // Firebase Real
  isRegistering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    const uid = cred.user.uid;

    const profileData: Record<string, unknown> = {
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role,
      createdAt: serverTimestamp(),
    };

    if (input.role === 'praktikan' && input.kelas) {
      profileData.kelas = input.kelas;
    }
    if (input.role === 'asisten' && input.inviteCode) {
      profileData.inviteCode = input.inviteCode.trim();
    }

    try {
      await setDoc(doc(db, 'users', uid), profileData);
    } catch (dbError) {
      // Rollback pembuatan akun auth bila dokumen profile gagal dibuat (FR-13)
      try {
        await cred.user.delete();
      } catch {
        // Abaikan error rollback
      }

      const mapped = mapFirebaseError(dbError);
      if (mapped.code === 'PERMISSION_DENIED' && input.role === 'asisten') {
        return {
          ok: false,
          code: 'PERMISSION_DENIED',
          message: 'Kode undangan asisten tidak sesuai',
        };
      }
      return { ok: false, code: mapped.code, message: mapped.message };
    }

    const createdUser: User = {
      id: uid,
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      role: input.role,
      kelas: input.kelas,
    };

    return { ok: true, data: createdUser };
  } catch (error) {
    const mapped = mapFirebaseError(error);
    return { ok: false, code: mapped.code, message: mapped.message };
  } finally {
    isRegistering = false;
  }
}

export async function login(email: string, password: string): Promise<Result<User>> {
  if (!isFirebaseReady || !auth || !db) {
    // Mode Fallback
    const user = getFallbackUsers().find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim(),
    );

    if (!user) {
      return { ok: false, code: 'INVALID_INPUT', message: 'Email atau kata sandi salah' };
    }

    fallbackCurrentUser = user;
    await safeStorage.setItem(FALLBACK_AUTH_KEY, user.id);
    notifyFallbackAuth(user);

    return { ok: true, data: user };
  }

  // Firebase Real
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profileRes = await getUserProfile(cred.user.uid);

    if (profileRes.state === 'not_found') {
      await signOut(auth);
      return {
        ok: false,
        code: 'NOT_FOUND',
        message: 'Profil pengguna tidak ditemukan. Hubungi administrator.',
      };
    }

    if (profileRes.state === 'error') {
      return {
        ok: false,
        code: 'NO_CONNECTION',
        message: 'Gagal memuat profil pengguna. Periksa koneksi internet.',
      };
    }

    return { ok: true, data: profileRes.user };
  } catch (error) {
    const mapped = mapFirebaseError(error);
    return { ok: false, code: mapped.code, message: mapped.message };
  }
}

export async function logout(): Promise<void> {
  if (!isFirebaseReady || !auth) {
    fallbackCurrentUser = null;
    await safeStorage.removeItem(FALLBACK_AUTH_KEY);
    notifyFallbackAuth(null);
    return;
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('[services/auth] logout error:', error);
  }
}

export function observeAuth(onUser: (user: User | null) => void): () => void {
  if (!isFirebaseReady || !auth) {
    // Jalankan cek persisten fallback dari safeStorage
    safeStorage.getItem(FALLBACK_AUTH_KEY).then((savedUid) => {
      if (savedUid) {
        const found = getFallbackUsers().find((u) => u.id === savedUid) ?? null;
        fallbackCurrentUser = found;
        onUser(found);
      } else {
        onUser(null);
      }
    });

    fallbackAuthListeners.add(onUser);
    return () => {
      fallbackAuthListeners.delete(onUser);
    };
  }

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      onUser(null);
      return;
    }

    // Jika registrasi sedang berlangsung, jangan intercept profil sebelum setDoc selesai (A-1, FR-16)
    if (isRegistering) {
      return;
    }

    try {
      const profileRes = await getUserProfile(fbUser.uid);
      if (profileRes.state === 'found') {
        onUser(profileRes.user);
      } else if (profileRes.state === 'not_found') {
        // FR-16: Profil benar-benar tidak ditemukan di Firestore, logout pengguna
        if (!isRegistering) {
          await signOut(auth!);
          onUser(null);
        }
      } else {
        // profileRes.state === 'error' (A-2: offline/error jaringan, jangan logout pengguna)
        console.warn('[services/auth] Gagal memuat profil pengguna karena error jaringan/offline. Sesi dipertahankan.');
      }
    } catch {
      // Jangan signOut bila error exception
    }
  });

  return unsubscribe;
}

function notifyFallbackAuth(user: User | null) {
  fallbackAuthListeners.forEach((listener) => {
    try {
      listener(user);
    } catch {
      // Abaikan error di callback
    }
  });
}
