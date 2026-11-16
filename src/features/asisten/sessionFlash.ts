import { setFlash, takeFlash } from '@/features/asisten/flash';

// Pesan sukses form ubah sesi untuk detail sesi; mekanismenya ada di flash.ts.
const scopeOf = (sessionId: string) => `sesi:${sessionId}`;

export function setSessionFlash(sessionId: string, message: string): void {
  setFlash(scopeOf(sessionId), message);
}

/** Mengambil lalu menghapus pesan untuk sesi ini; null bila tidak ada. */
export function takeSessionFlash(sessionId: string): string | null {
  return takeFlash(scopeOf(sessionId));
}
