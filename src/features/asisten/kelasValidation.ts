import type { KelasPraktikum } from '@/types';

// SRS §4.2: praktikum 2–50 karakter, kelas 1–10 karakter, pasangan unik.
export const PRAKTIKUM_MIN_LENGTH = 2;
export const PRAKTIKUM_MAX_LENGTH = 50;
export const KELAS_MAX_LENGTH = 10;

export type KelasFormValues = { praktikum: string; kelas: string };
export type KelasFormInput = { praktikum: string; kelas: string };
export type KelasFormErrors = Partial<Record<keyof KelasFormValues, string>>;

export type KelasFormResult =
  | { ok: true; input: KelasFormInput }
  | { ok: false; errors: KelasFormErrors };

export const DUPLICATE_KELAS_MESSAGE = 'Kelas ini sudah ada untuk praktikum tersebut.';

export function emptyKelasFormValues(): KelasFormValues {
  return { praktikum: '', kelas: '' };
}

/** Dipangkas dan spasi berlebih diringkas agar "Basis  Data" dan "Basis Data" dianggap sama. */
export function normalizePraktikum(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

/** services/kelas menyimpan kelas dalam huruf besar; validasi memakai bentuk yang sama. */
export function normalizeKelas(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function samePair(a: KelasFormInput, b: Pick<KelasPraktikum, 'praktikum' | 'kelas'>): boolean {
  return (
    a.praktikum.toLowerCase() === normalizePraktikum(b.praktikum).toLowerCase() &&
    a.kelas === normalizeKelas(b.kelas)
  );
}

/**
 * Validasi form kelas praktikum (SRS §4.2). `existing` adalah daftar kelasPraktikum saat ini;
 * `editId` dikecualikan dari cek pasangan unik agar menyimpan tanpa perubahan tidak ditolak.
 * Perbandingan praktikum tidak peka huruf besar-kecil supaya tidak lahir duplikat seperti
 * "basis data" di samping "Basis Data".
 */
export function validateKelasForm(
  values: KelasFormValues,
  existing: readonly Pick<KelasPraktikum, 'id' | 'praktikum' | 'kelas'>[],
  editId?: string,
): KelasFormResult {
  const input: KelasFormInput = {
    praktikum: normalizePraktikum(values.praktikum),
    kelas: normalizeKelas(values.kelas),
  };
  const errors: KelasFormErrors = {};

  if (input.praktikum.length === 0) {
    errors.praktikum = 'Praktikum wajib diisi.';
  } else if (input.praktikum.length < PRAKTIKUM_MIN_LENGTH) {
    errors.praktikum = `Praktikum minimal ${PRAKTIKUM_MIN_LENGTH} karakter.`;
  } else if (input.praktikum.length > PRAKTIKUM_MAX_LENGTH) {
    errors.praktikum = `Praktikum maksimal ${PRAKTIKUM_MAX_LENGTH} karakter.`;
  }

  if (input.kelas.length === 0) {
    errors.kelas = 'Kelas wajib diisi.';
  } else if (input.kelas.length > KELAS_MAX_LENGTH) {
    errors.kelas = `Kelas maksimal ${KELAS_MAX_LENGTH} karakter.`;
  }

  if (!errors.praktikum && !errors.kelas) {
    const duplicate = existing.some((item) => item.id !== editId && samePair(input, item));
    if (duplicate) errors.kelas = DUPLICATE_KELAS_MESSAGE;
  }

  return errors.praktikum || errors.kelas ? { ok: false, errors } : { ok: true, input };
}
