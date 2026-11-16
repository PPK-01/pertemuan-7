import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore, useIsOnline } from '@/store/appStore';
import type { SyncKey } from '@/store/appStore';

/**
 * Batas tunggu tombol "Coba lagi" bila listener tidak kunjung siap atau gagal, mis. Firestore
 * menunggu koneksi tanpa memanggil callback. Setelahnya spinner berhenti dan tombol bisa
 * ditekan lagi. Sama dengan timeout tulis 10 detik di SRS.
 */
export const RETRY_TIMEOUT_MS = 10_000;

export const SYNC_ERROR_MESSAGE = 'Gagal memuat data. Periksa koneksi lalu coba lagi.';
export const SYNC_ERROR_OFFLINE_MESSAGE =
  'Gagal memuat data karena tidak ada koneksi internet. Coba lagi setelah tersambung.';

export type SyncRetry = {
  /** Ada listener berstatus error, atau percobaan ulang belum selesai. */
  visible: boolean;
  retrying: boolean;
  message: string;
  retry: () => void;
};

/**
 * State "Coba lagi" untuk listener `keys` (NFR-02). `keys` sebaiknya konstanta di luar
 * komponen. Hanya listener milik `keys` yang error yang dipasang ulang, masing-masing dengan
 * `retrySync(key)`, agar tombol di satu bagian layar tidak memasang ulang listener bagian lain.
 *
 * Store hanya menyimpan status listener, jadi key yang sedang dicoba ulang disimpan lokal.
 * Selesai begitu key itu tidak lagi 'loading' (berhasil atau gagal lagi). Bila masih 'loading'
 * setelah RETRY_TIMEOUT_MS, spinner berhenti tetapi pesan dan tombol tetap tampil agar asisten
 * bisa mencoba lagi. Selama spinner berjalan tekanan beruntun diabaikan.
 */
export function useSyncRetry(keys: readonly SyncKey[]): SyncRetry {
  const statuses = useAppStore(useShallow((state) => keys.map((key) => state.sync[key])));
  const retrySync = useAppStore((state) => state.retrySync);
  const isOnline = useIsOnline();
  const [pendingKeys, setPendingKeys] = useState<readonly SyncKey[] | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const errorKeys = useMemo(
    () => keys.filter((_, index) => statuses[index] === 'error'),
    [keys, statuses],
  );
  const pendingLoading =
    pendingKeys !== null &&
    keys.some((key, index) => pendingKeys.includes(key) && statuses[index] === 'loading');

  useEffect(() => {
    if (pendingKeys !== null && !pendingLoading) setPendingKeys(null);
  }, [pendingKeys, pendingLoading]);

  useEffect(() => {
    if (pendingKeys === null) return;
    const timer = setTimeout(() => setTimedOut(true), RETRY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingKeys]);

  const retrying = pendingLoading && !timedOut;

  const retry = useCallback(() => {
    if (retrying) return;
    // Listener yang macet di 'loading' setelah batas waktu ikut dicoba lagi.
    const targets = errorKeys.length > 0 ? errorKeys : (pendingKeys ?? []);
    if (targets.length === 0) return;
    setTimedOut(false);
    setPendingKeys([...targets]);
    targets.forEach((key) => retrySync(key));
  }, [retrying, errorKeys, pendingKeys, retrySync]);

  return {
    visible: errorKeys.length > 0 || pendingLoading,
    retrying,
    message: isOnline ? SYNC_ERROR_MESSAGE : SYNC_ERROR_OFFLINE_MESSAGE,
    retry,
  };
}
