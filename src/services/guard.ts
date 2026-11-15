import { connectionService } from './connection';
import { isFirebaseReady } from './firebase';
import { mapFirebaseError } from './errors';
import type { Result } from '@/types';

/**
 * Pembungkus aksi tulis data (FR-29, NFR-09):
 * 1. Pra-cek status koneksi jaringan.
 * 2. Batas waktu eksekusi (timeout) 10 detik.
 * 3. Menjamin aksi tidak menggantung di antrean offline Firestore.
 */
export async function withWriteGuard<T = void>(
  action: () => Promise<Result<T>>,
  timeoutMs: number = 10000,
): Promise<Result<T>> {
  // Bila Firebase terkonfigurasi tetapi perangkat offline, blokir aksi tulis (FR-29)
  if (isFirebaseReady && !connectionService.isConnected) {
    return {
      ok: false,
      code: 'NO_CONNECTION',
      message: 'Tidak ada koneksi internet. Aksi tidak dapat dilakukan saat offline.',
    };
  }

  // Jika in-memory / fallback tanpa Firebase, langsung jalankan tanpa timeout
  if (!isFirebaseReady) {
    return action();
  }

  // Firebase Real: jalankan dengan batas timeout 10 detik
  return new Promise<Result<T>>((resolve) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve({
          ok: false,
          code: 'TIMEOUT',
          message: 'Koneksi terputus atau batas waktu terlampaui (10 detik).',
        });
      }
    }, timeoutMs);

    action()
      .then((res) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve(res);
        }
      })
      .catch((err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          const mapped = mapFirebaseError(err);
          resolve({ ok: false, code: mapped.code, message: mapped.message });
        }
      });
  });
}
