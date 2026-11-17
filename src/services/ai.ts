import type { AiResult, IzinKategori } from '@/types';

// Kata kunci dan frasa per kategori sesuai SRS v2.2 §5.3
export const AI_KEYWORDS: Record<Exclude<IzinKategori, 'lainnya'>, string[]> = {
  sakit: [
    'sakit',
    'demam',
    'dirawat',
    'rumah sakit',
    'opname',
    'dokter',
    'klinik',
    'operasi',
    'kecelakaan',
  ],
  keluarga: [
    'meninggal',
    'wafat',
    'duka',
    'pemakaman',
    'orang tua sakit',
    'keluarga sakit',
    'saudara menikah',
    'nikahan saudara',
  ],
  akademik: [
    'lomba',
    'kompetisi',
    'seminar',
    'konferensi',
    'ujian',
    'delegasi',
    'dispensasi',
    'surat tugas',
  ],
  tidak_jelas: [
    'malas',
    'ketiduran',
    'lupa',
    'bangun kesiangan',
    'main game',
    'nongkrong',
  ],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchKeyword(normalized: string, keyword: string): boolean {
  const words = normalized.split(' ');
  const kwWords = keyword.split(' ');
  if (kwWords.length === 1) {
    return words.includes(kwWords[0]);
  }
  const padded = ' ' + normalized + ' ';
  return padded.includes(' ' + keyword + ' ');
}

/**
 * Menentukan kategori pengajuan izin berdasarkan kata kunci/frasa (SRS v2.2 §5.3).
 * Prioritas: sakit > keluarga > akademik > tidak_jelas > lainnya.
 * Fungsi murni, diekspor agar dapat diuji secara independen.
 */
export function categorizeIzin(alasan: string): IzinKategori {
  const norm = normalizeText(alasan);
  const categories: Array<Exclude<IzinKategori, 'lainnya'>> = [
    'sakit',
    'keluarga',
    'akademik',
    'tidak_jelas',
  ];

  for (const cat of categories) {
    for (const kw of AI_KEYWORDS[cat]) {
      if (matchKeyword(norm, kw)) {
        return cat;
      }
    }
  }

  return 'lainnya';
}

/**
 * Menurunkan saran dari kategori (SRS v2.2 §5.3):
 * - sakit / keluarga / akademik -> diterima
 * - tidak_jelas -> ditolak
 * - lainnya -> perlu_cek
 */
export function getSaranFromKategori(
  kategori: IzinKategori,
): 'diterima' | 'ditolak' | 'perlu_cek' {
  switch (kategori) {
    case 'sakit':
    case 'keluarga':
    case 'akademik':
      return 'diterima';
    case 'tidak_jelas':
      return 'ditolak';
    case 'lainnya':
    default:
      return 'perlu_cek';
  }
}

// Inisialisasi Model Analisis Sentimen EDOM On-Device (SRS v2.2 §5.4)
// Dibungkus try-catch agar kegagalan format model tidak membuat aplikasi crash saat impor modul.
let classifySentiment: ((text: string) => {
  label: 'positif' | 'netral' | 'negatif' | null;
  status: string;
  scores: number[] | null;
}) | null = null;

let modelLabels: string[] = ['negatif', 'netral', 'positif'];

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createSentimentClassifier } = require('../../ai/sentiment.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const modelEdom = require('../../ai/model-edom.json');
  if (Array.isArray(modelEdom?.labels)) {
    modelLabels = modelEdom.labels;
  }
  classifySentiment = createSentimentClassifier(modelEdom);
} catch (err) {
  console.warn('[services/ai] Gagal memuat model EDOM:', err);
  classifySentiment = null;
}

/**
 * Mengklasifikasikan pengajuan izin menggunakan pipeline SRS v2.2 §5:
 * 1. Sentimen teks dari model EDOM on-device (informasi eksperimental).
 * 2. Kategori alasan dari pencocokan kata kunci/frasa utuh.
 * 3. Saran diturunkan dari kategori (bukan dari sentimen).
 * 
 * Kontrak: Tidak pernah melempar exception; kegagalan dikembalikan sebagai Result failed.
 */
export async function classifyIzin(alasan: string): Promise<AiResult> {
  const at = new Date().toISOString();
  // Bersihkan tag pemicu uji bila ada agar analisis tetap berjalan normal
  const cleanAlasan = (alasan ?? '').replace(/\[ai-error\]/gi, '').trim();
  const trimmed = cleanAlasan || (alasan?.trim() ?? '');

  try {
    let sentimen: 'positif' | 'netral' | 'negatif' | null = null;
    let skor: Record<string, number> | null = null;

    if (classifySentiment) {
      const pred = classifySentiment(trimmed);
      sentimen = pred?.label ?? null;
      if (Array.isArray(pred?.scores)) {
        skor = Object.fromEntries(
          modelLabels.map((lbl, idx) => [lbl, pred.scores![idx]]),
        );
      }
    } else {
      // Model tidak tersedia/gagal dimuat
      return {
        state: 'failed',
        errorCode: 'MODEL_ERROR',
        at,
      };
    }

    const kategori = categorizeIzin(trimmed);
    const saran = getSaranFromKategori(kategori);

    const sentimenText = sentimen ?? 'tidak dikenali';
    const penjelasan = `Alasan terdeteksi kategori ${kategori}. Sentimen teks: ${sentimenText} (eksperimental).`;

    return {
      state: 'success',
      kategori,
      saran,
      sentimen,
      skor,
      penjelasan: penjelasan.slice(0, 200),
      eksperimental: true,
      at,
    };
  } catch (err) {
    console.warn('[services/ai] Exception inferensi:', err);
    return {
      state: 'failed',
      errorCode: 'MODEL_ERROR',
      at,
    };
  }
}
