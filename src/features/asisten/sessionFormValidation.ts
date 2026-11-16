import type { CreateSessionInput, Kelas, KelasPraktikum, Praktikum, Session } from '@/types';

/** Isian form sesi tanpa pembuat; createdBy diisi layar dari currentUser. */
export type SessionFormInput = Omit<CreateSessionInput, 'createdBy'>;

// Batas panjang SRS §4.2.
export const TOPIK_MIN_LENGTH = 3;
export const TOPIK_MAX_LENGTH = 100;
export const RUANG_MAX_LENGTH = 30;

export type SessionFormValues = {
  praktikum: Praktikum | null;
  kelas: Kelas | null;
  topik: string;
  ruang: string;
  /** DD/MM/YYYY; pemisah '/', '-', atau '.'. */
  tanggal: string;
  /** HH.MM 24 jam; pemisah '.' atau ':'. */
  jamMulai: string;
  /** HH.MM 24 jam; pemisah '.' atau ':'. */
  jamSelesai: string;
};

export type SessionFormErrors = Partial<Record<keyof SessionFormValues, string>>;

export type SessionFormResult =
  | { ok: true; input: SessionFormInput }
  | { ok: false; errors: SessionFormErrors };

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

type DateParts = { year: number; month: number; day: number };
type TimeParts = { hour: number; minute: number };

const DATE_PATTERN = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
const TIME_PATTERN = /^(\d{1,2})[.:](\d{2})$/;

function parseDate(text: string): Parsed<DateParts> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Tanggal wajib diisi' };

  const match = DATE_PATTERN.exec(trimmed);
  if (!match) return { ok: false, error: 'Gunakan format DD/MM/YYYY' };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  // Date menggeser tanggal yang melimpah (31/02 menjadi 03/03), jadi komponennya dicek ulang.
  const date = new Date(year, month - 1, day);
  const valid =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!valid) return { ok: false, error: 'Tanggal tidak valid' };

  return { ok: true, value: { year, month, day } };
}

function parseTime(text: string): Parsed<TimeParts> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Jam wajib diisi' };

  const match = TIME_PATTERN.exec(trimmed);
  if (!match) return { ok: false, error: 'Gunakan format HH.MM' };

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { ok: false, error: 'Jam tidak valid' };

  return { ok: true, value: { hour, minute } };
}

function toIso({ year, month, day }: DateParts, { hour, minute }: TimeParts): string {
  // Waktu lokal perangkat, disimpan sebagai ISO UTC (SRS §3).
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

/**
 * `pairs` diisi dari useKelasList(); bila ada, pasangan praktikum dan kelas wajib terdaftar
 * di kelasPraktikum (SRS §4.2). Lewati bila kedua kolom dikunci (sesi Dibuka).
 */
export function validateSessionForm(
  values: SessionFormValues,
  pairs?: readonly Pick<KelasPraktikum, 'praktikum' | 'kelas'>[],
): SessionFormResult {
  const errors: SessionFormErrors = {};
  const topik = values.topik.trim();
  const ruang = values.ruang.trim();

  if (!values.praktikum) errors.praktikum = 'Pilih praktikum';
  if (!values.kelas) errors.kelas = 'Pilih kelas';
  if (!topik) errors.topik = 'Topik wajib diisi';
  else if (topik.length < TOPIK_MIN_LENGTH) errors.topik = `Topik minimal ${TOPIK_MIN_LENGTH} karakter`;
  if (!ruang) errors.ruang = 'Ruang wajib diisi';

  if (
    pairs &&
    values.praktikum &&
    values.kelas &&
    !pairs.some((pair) => pair.praktikum === values.praktikum && pair.kelas === values.kelas)
  ) {
    errors.kelas = 'Kelas ini tidak terdaftar untuk praktikum tersebut';
  }

  const tanggal = parseDate(values.tanggal);
  if (!tanggal.ok) errors.tanggal = tanggal.error;

  const jamMulai = parseTime(values.jamMulai);
  if (!jamMulai.ok) errors.jamMulai = jamMulai.error;

  const jamSelesai = parseTime(values.jamSelesai);
  if (!jamSelesai.ok) {
    errors.jamSelesai = jamSelesai.error;
  } else if (jamMulai.ok) {
    const start = jamMulai.value.hour * 60 + jamMulai.value.minute;
    const end = jamSelesai.value.hour * 60 + jamSelesai.value.minute;
    if (end <= start) errors.jamSelesai = 'Jam selesai harus setelah jam mulai';
  }

  if (
    !values.praktikum ||
    !values.kelas ||
    !tanggal.ok ||
    !jamMulai.ok ||
    !jamSelesai.ok ||
    Object.keys(errors).length > 0
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    input: {
      praktikum: values.praktikum,
      kelas: values.kelas,
      topik,
      ruang,
      startAt: toIso(tanggal.value, jamMulai.value),
      endAt: toIso(tanggal.value, jamSelesai.value),
    },
  };
}

/** DD/MM/YYYY dalam waktu lokal, untuk mengisi tanggal awal form. */
export function formatDateInput(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** HH.MM 24 jam dalam waktu lokal, untuk mengisi jam form ubah. */
export function formatTimeInput(date: Date): string {
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}.${minute}`;
}

/** Isian awal form kosong untuk mode buat. */
export function emptySessionFormValues(): SessionFormValues {
  return {
    praktikum: null,
    kelas: null,
    topik: '',
    ruang: '',
    tanggal: formatDateInput(new Date()),
    jamMulai: '',
    jamSelesai: '',
  };
}

/** Isian awal form ubah dari sesi yang ada, dalam waktu lokal perangkat. */
export function sessionToFormValues(session: Session): SessionFormValues {
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);
  return {
    praktikum: session.praktikum,
    kelas: session.kelas,
    topik: session.topik,
    ruang: session.ruang,
    tanggal: formatDateInput(start),
    jamMulai: formatTimeInput(start),
    jamSelesai: formatTimeInput(end),
  };
}
