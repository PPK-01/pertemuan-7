import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore, useIsOnline } from '@/store/appStore';
import type { SyncKey } from '@/store/appStore';

/**
 * Batas tunggu tombol "Coba lagi" bila listener tidak kunjung siap atau gagal, mis. Firestore
 * menunggu koneksi tanpa memanggil callback. Setelahnya tombol bisa ditekan lagi. Sama dengan
 * timeout tulis 10 detik di SRS.
 */
export const RETRY_TIMEOUT_MS = 10_000;

export const SYNC_ERROR_MESSAGE = 'Gagal memuat data. Periksa koneksi lalu coba lagi.';
export const SYNC_ERROR_OFFLINE_MESSAGE =
  'Gagal memuat data karena tidak ada koneksi internet. Coba lagi setelah tersambung.';

export type SyncRetry = {
  /** Ada listener berstatus error, atau percobaan ulang sedang berjalan. */
  visible: boolean;
  retrying: boolean;
  message: string;
  retry: () => void;
};

/**
 * State "Coba lagi" untuk listener `keys` (NFR-02). `keys` sebaiknya konstanta di luar
 * komponen. Satu listener error dipasang ulang dengan `retrySync(key)`; bila beberapa error
 * sekaligus, `retrySync()` tanpa key memasang ulang semua yang error.
 *
 * `retrying` lokal karena store hanya menyimpan status listener: kembali false begitu tidak
 * ada key yang 'loading' (berhasil atau gagal lagi), atau setelah RETRY_TIMEOUT_MS. Selama
 * true tombol menampilkan spinner sehingga tekanan beruntun saat offline tidak memasang ulang
 * listener berkali-kali.
 */
export function useSyncRetry(keys: readonly SyncKey[]): SyncRetry {
  const statuses = useAppStore(useShallow((state) => keys.map((key) => state.sync[key])));
  const retrySync = useAppStore((state) => state.retrySync);
  const isOnline = useIsOnline();
  const [retrying, setRetrying] = useState(false);

  const errorKeys = useMemo(
    () => keys.filter((_, index) => statuses[index] === 'error'),
    [keys, statuses],
  );
  const anyLoading = statuses.includes('loading');

  useEffect(() => {
    if (retrying && !anyLoading) setRetrying(false);
  }, [retrying, anyLoading]);

  useEffect(() => {
    if (!retrying) return;
    const timer = setTimeout(() => setRetrying(false), RETRY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [retrying]);

  const retry = useCallback(() => {
    if (retrying || errorKeys.length === 0) return;
    setRetrying(true);
    if (errorKeys.length === 1) {
      retrySync(errorKeys[0]);
    } else {
      retrySync();
    }
  }, [retrying, errorKeys, retrySync]);

  return {
    visible: errorKeys.length > 0 || retrying,
    retrying,
    message: isOnline ? SYNC_ERROR_MESSAGE : SYNC_ERROR_OFFLINE_MESSAGE,
    retry,
  };
}
