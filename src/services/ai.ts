import type { AiResult, IzinKategori } from '@/types';

export type ClassifyIzinInput = {
  praktikum: string;
  topik: string;
  tanggalSesi: string;
  alasan: string;
};

// Inisialisasi Model Analisis Sentimen EDOM (On-Device Inference)
// Berjalan murni di JavaScript tanpa koneksi jaringan maupun dependency native
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createSentimentClassifier } = require('../../ai/sentiment.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const modelEdom = require('../../ai/model-edom.json');

const classifySentiment = createSentimentClassifier(modelEdom);

function inferKategori(alasan: string): IzinKategori {
  const lower = alasan.toLowerCase();

  if (
    lower.includes('sakit') ||
    lower.includes('demam') ||
    lower.includes('rawat') ||
    lower.includes('opname') ||
    lower.includes('dokter') ||
    lower.includes('pusing') ||
    lower.includes('flu')
  ) {
    return 'sakit';
  }

  if (
    lower.includes('keluarga') ||
    lower.includes('orang tua') ||
    lower.includes('ayah') ||
    lower.includes('ibu') ||
    lower.includes('saudara') ||
    lower.includes('duka') ||
    lower.includes('nikah')
  ) {
    return 'keluarga';
  }

  if (
    lower.includes('kuliah') ||
    lower.includes('lomba') ||
    lower.includes('ujian') ||
    lower.includes('seminar') ||
    lower.includes('sidang') ||
    lower.includes('organisasi') ||
    lower.includes('kegiatan')
  ) {
    return 'akademik';
  }

  return 'lainnya';
}

/**
 * Mengklasifikasikan pengajuan izin menggunakan Model EDOM On-Device.
 * Kontrak: Tidak pernah throw error; selalu mengembalikan Promise<AiResult>.
 */
export async function classifyIzin(input: ClassifyIzinInput): Promise<AiResult> {
  const at = new Date().toISOString();

  try {
    const text = input.alasan?.trim() ?? '';
    const prediction = classifySentiment(text);

    if (!prediction || prediction.label === null) {
      return {
        state: 'failed',
        errorCode: 'INVALID_RESPONSE',
        at,
      };
    }

    const kategori = inferKategori(text);
    const sentimen = prediction.label as 'positif' | 'netral' | 'negatif';
    const keputusan: 'diterima' | 'ditolak' = sentimen === 'negatif' ? 'ditolak' : 'diterima';

    const penjelasan = `Model EDOM: Sentimen terdeteksi "${sentimen}". Saran: ${keputusan}.`;

    return {
      state: 'success',
      keputusan,
      kategori,
      alasan: penjelasan,
      at,
    };
  } catch (err) {
    console.warn('[AI/EDOM] Gagal inferensi lokal:', err);
    return {
      state: 'failed',
      errorCode: 'INVALID_RESPONSE',
      at,
    };
  }
}
