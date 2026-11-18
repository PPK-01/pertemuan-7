import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';
import { devWarn } from './devLog';
import { mapFirebaseError } from './errors';
import { dummyKelasPraktikum } from '@/data/dummy';
import { getInMemorySessions } from './sessions';
import type { KelasPraktikum, Result } from '@/types';
import { createId } from '@/utils/id';

let inMemoryKelas: KelasPraktikum[] = [...dummyKelasPraktikum];
const fallbackKelasListeners = new Set<(list: KelasPraktikum[]) => void>();

function notifyFallbackKelasListeners() {
  fallbackKelasListeners.forEach((listener) => {
    try {
      listener(inMemoryKelas);
    } catch {
      // Abaikan error di callback
    }
  });
}

export function listenKelas(
  onData: (list: KelasPraktikum[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!isFirebaseReady || !db) {
    onData(inMemoryKelas);
    fallbackKelasListeners.add(onData);
    return () => {
      fallbackKelasListeners.delete(onData);
    };
  }

  const unsubscribe = onSnapshot(
    collection(db, 'kelasPraktikum'),
    (snapshot) => {
      const list: KelasPraktikum[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          praktikum: data.praktikum,
          kelas: data.kelas,
          createdBy: data.createdBy,
        };
      });
      onData(list);
    },
    (error) => {
      devWarn('kelas', error);
      if (onError) onError(error);
    },
  );

  return unsubscribe;
}

export async function addKelas(
  praktikum: string,
  kelas: string,
  userId: string,
): Promise<Result<KelasPraktikum>> {
  const p = praktikum.trim();
  const k = kelas.trim().toUpperCase();

  if (!p || !k) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Praktikum dan kelas wajib diisi' };
  }

  if (!isFirebaseReady || !db) {
    const exists = inMemoryKelas.some(
      (item) => item.praktikum.toLowerCase() === p.toLowerCase() && item.kelas.toUpperCase() === k,
    );
    if (exists) {
      return { ok: false, code: 'DUPLICATE', message: 'Kelas praktikum sudah ada' };
    }

    const newKelas: KelasPraktikum = {
      id: createId('kp'),
      praktikum: p,
      kelas: k,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryKelas = [...inMemoryKelas, newKelas];
    notifyFallbackKelasListeners();
    return { ok: true, data: newKelas };
  }

  try {
    const q = query(
      collection(db, 'kelasPraktikum'),
      where('praktikum', '==', p),
      where('kelas', '==', k),
      limit(1),
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { ok: false, code: 'DUPLICATE', message: 'Kelas praktikum sudah ada' };
    }

    const newId = createId('kp');
    await setDoc(doc(db, 'kelasPraktikum', newId), {
      praktikum: p,
      kelas: k,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      ok: true,
      data: { id: newId, praktikum: p, kelas: k, createdBy: userId },
    };
  } catch (error) {
    const mapped = mapFirebaseError(error);
    return { ok: false, code: mapped.code, message: mapped.message };
  }
}

export async function updateKelas(
  id: string,
  praktikum: string,
  kelas: string,
): Promise<Result> {
  const p = praktikum.trim();
  const k = kelas.trim().toUpperCase();

  if (!p || !k) {
    return { ok: false, code: 'INVALID_INPUT', message: 'Praktikum dan kelas wajib diisi' };
  }

  if (!isFirebaseReady || !db) {
    const target = inMemoryKelas.find((item) => item.id === id);
    if (!target) {
      return { ok: false, code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' };
    }

    // FR-20: Cek apakah kelas masih digunakan oleh sesi bila nama praktikum/kelas diubah
    if (target.praktikum !== p || target.kelas !== k) {
      const isUsed = getInMemorySessions().some(
        (s) => s.praktikum === target.praktikum && s.kelas === target.kelas,
      );
      if (isUsed) {
        return {
          ok: false,
          code: 'IN_USE',
          message: 'Kelas tidak dapat diubah karena masih digunakan oleh sesi praktikum',
        };
      }
    }

    // Cek duplikasi
    const duplicate = inMemoryKelas.some(
      (item) => item.id !== id && item.praktikum.toLowerCase() === p.toLowerCase() && item.kelas.toUpperCase() === k,
    );
    if (duplicate) {
      return { ok: false, code: 'DUPLICATE', message: 'Kelas praktikum sudah ada' };
    }

    inMemoryKelas = inMemoryKelas.map((item) =>
      item.id === id ? { ...item, praktikum: p, kelas: k, updatedAt: new Date().toISOString() } : item,
    );
    notifyFallbackKelasListeners();
    return { ok: true, data: undefined };
  }

  try {
    const docRef = doc(db, 'kelasPraktikum', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { ok: false, code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' };
    }

    const currentData = docSnap.data();

    // FR-20: Cek apakah kelas masih digunakan oleh sesi bila praktikum/kelas berubah
    if (currentData.praktikum !== p || currentData.kelas !== k) {
      const sessionQuery = query(
        collection(db, 'sessions'),
        where('praktikum', '==', currentData.praktikum),
        where('kelas', '==', currentData.kelas),
        limit(1),
      );
      const sessionSnap = await getDocs(sessionQuery);
      if (!sessionSnap.empty) {
        return {
          ok: false,
          code: 'IN_USE',
          message: 'Kelas tidak dapat diubah karena masih digunakan oleh sesi praktikum',
        };
      }
    }

    // Cek duplikasi nama
    const dupQuery = query(
      collection(db, 'kelasPraktikum'),
      where('praktikum', '==', p),
      where('kelas', '==', k),
      limit(1),
    );
    const dupSnap = await getDocs(dupQuery);
    if (!dupSnap.empty && dupSnap.docs[0].id !== id) {
      return { ok: false, code: 'DUPLICATE', message: 'Kelas praktikum sudah ada' };
    }

    await updateDoc(docRef, {
      praktikum: p,
      kelas: k,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, data: undefined };
  } catch (error) {
    const mapped = mapFirebaseError(error);
    return { ok: false, code: mapped.code, message: mapped.message };
  }
}

export async function deleteKelas(id: string): Promise<Result> {
  if (!isFirebaseReady || !db) {
    const target = inMemoryKelas.find((item) => item.id === id);
    if (!target) {
      return { ok: false, code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' };
    }

    // FR-20: Cek apakah kelas masih digunakan oleh sesi praktikum
    const isUsed = getInMemorySessions().some(
      (s) => s.praktikum === target.praktikum && s.kelas === target.kelas,
    );
    if (isUsed) {
      return {
        ok: false,
        code: 'IN_USE',
        message: 'Kelas tidak dapat dihapus karena masih digunakan oleh sesi praktikum',
      };
    }

    inMemoryKelas = inMemoryKelas.filter((item) => item.id !== id);
    notifyFallbackKelasListeners();
    return { ok: true, data: undefined };
  }

  try {
    const docRef = doc(db, 'kelasPraktikum', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { ok: false, code: 'NOT_FOUND', message: 'Kelas tidak ditemukan' };
    }

    const currentData = docSnap.data();

    // FR-20: Cek apakah kelas masih digunakan oleh sesi praktikum
    const sessionQuery = query(
      collection(db, 'sessions'),
      where('praktikum', '==', currentData.praktikum),
      where('kelas', '==', currentData.kelas),
      limit(1),
    );
    const sessionSnap = await getDocs(sessionQuery);
    if (!sessionSnap.empty) {
      return {
        ok: false,
        code: 'IN_USE',
        message: 'Kelas tidak dapat dihapus karena masih digunakan oleh sesi praktikum',
      };
    }

    await deleteDoc(docRef);
    return { ok: true, data: undefined };
  } catch (error) {
    const mapped = mapFirebaseError(error);
    return { ok: false, code: mapped.code, message: mapped.message };
  }
}
