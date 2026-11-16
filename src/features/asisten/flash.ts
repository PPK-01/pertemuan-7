/**
 * Pesan sukses satu kali yang dibawa ke layar sebelumnya saat kembali dengan router.back(),
 * mis. form ubah sesi ke detail sesi atau form kelas ke daftar kelas. router.back() tidak bisa
 * membawa parameter, dan pesan ini status tampilan sementara, bukan data domain, sehingga
 * tidak disimpan di store. Hanya satu pesan yang menunggu; pesan baru menggantikan yang lama.
 */
let pending: { scope: string; message: string } | null = null;

export function setFlash(scope: string, message: string): void {
  pending = { scope, message };
}

/** Mengambil lalu menghapus pesan untuk `scope` ini; null bila tidak ada. */
export function takeFlash(scope: string): string | null {
  if (!pending || pending.scope !== scope) return null;
  const { message } = pending;
  pending = null;
  return message;
}
