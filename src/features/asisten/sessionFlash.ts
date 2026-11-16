/**
 * Pesan sukses satu kali yang dibawa ke layar sebelumnya saat kembali dengan router.back(),
 * mis. form ubah sesi ke detail sesi. router.back() tidak bisa membawa parameter, dan pesan
 * ini status tampilan sementara, bukan data domain, sehingga tidak disimpan di store.
 */
let pending: { sessionId: string; message: string } | null = null;

export function setSessionFlash(sessionId: string, message: string): void {
  pending = { sessionId, message };
}

/** Mengambil lalu menghapus pesan untuk sesi ini; null bila tidak ada. */
export function takeSessionFlash(sessionId: string): string | null {
  if (!pending || pending.sessionId !== sessionId) return null;
  const { message } = pending;
  pending = null;
  return message;
}
