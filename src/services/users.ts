import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { devWarn } from './devLog';
import { db, isFirebaseReady } from './firebase';
import { dummyUsers } from '@/data/dummy';
import type { User } from '@/types';

// In-Memory store untuk fallback
let inMemoryUsers: User[] = [...dummyUsers];
const fallbackPraktikanListeners = new Set<(users: User[]) => void>();

export function setFallbackUsers(users: User[]) {
  inMemoryUsers = users;
  const praktikanOnly = inMemoryUsers.filter((u) => u.role === 'praktikan');
  fallbackPraktikanListeners.forEach((listener) => {
    try {
      listener(praktikanOnly);
    } catch {
      // Abaikan error di callback
    }
  });
}

export function getFallbackUsers(): User[] {
  return inMemoryUsers;
}

export type GetUserProfileResult =
  | { state: 'found'; user: User }
  | { state: 'not_found' }
  | { state: 'error'; error: unknown };

/**
 * Mengambil profil pengguna dari Firestore dengan membedakan
 * status dokumen tidak ditemukan vs error jaringan/offline (A-2, FR-16).
 */
export async function getUserProfile(uid: string): Promise<GetUserProfileResult> {
  if (!isFirebaseReady || !db) {
    const found = inMemoryUsers.find((u) => u.id === uid);
    return found ? { state: 'found', user: found } : { state: 'not_found' };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return { state: 'not_found' };
    }
    const data = userDoc.data();
    return {
      state: 'found',
      user: {
        id: userDoc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        kelas: data.kelas,
      },
    };
  } catch (error) {
    return { state: 'error', error };
  }
}

export async function getUser(uid: string): Promise<User | null> {
  const res = await getUserProfile(uid);
  return res.state === 'found' ? res.user : null;
}

export function listenPraktikan(
  onData: (users: User[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!isFirebaseReady || !db) {
    const praktikanOnly = inMemoryUsers.filter((u) => u.role === 'praktikan');
    onData(praktikanOnly);
    fallbackPraktikanListeners.add(onData);
    return () => {
      fallbackPraktikanListeners.delete(onData);
    };
  }

  const q = query(collection(db, 'users'), where('role', '==', 'praktikan'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users: User[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          email: data.email,
          role: data.role,
          kelas: data.kelas,
        };
      });
      onData(users);
    },
    (error) => {
      devWarn('users', error);
      if (onError) onError(error);
    },
  );

  return unsubscribe;
}
