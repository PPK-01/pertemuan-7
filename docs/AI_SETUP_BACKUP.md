# Panduan Setup & Cadangan (Backup) Layanan AI Rawuh

Dokumen ini mendokumentasikan setup model kecerdasan buatan (AI) yang digunakan untuk fitur analisis izin praktikum, serta menyediakan panduan pemulihan (*switch/restore*) ke implementasi HTTP API sebelumnya bila sewaktu-waktu diinstruksikan oleh pengajar atau asisten praktikum.

---

## 1. Status Model Saat Ini: Model Analisis Sentimen EDOM (Lokal)

Sesuai arahan revisi asisten praktikum dari panduan [Doctor3131/ppk-rn-expo-58](https://github.com/Doctor3131/ppk-rn-expo-58/blob/main/docs/Pertemuan%202/Model%20EDOM.md), aplikasi menggunakan **Model EDOM (Evaluasi Dosen oleh Mahasiswa)** untuk menganalisis teks alasan ketidakhadiran praktikan.

### Karakteristik Model:
- **Lokasi Berkas:**
  - `ai/model-edom.json`: Berkas bobot model (unigram/bigram, TF-L2, LinearSVC).
  - `ai/sentiment.js`: Fungsi inferensi murni JavaScript (`createSentimentClassifier`).
- **Eksekusi:** On-device / *in-app inference* (berjalan offline, tanpa koneksi jaringan, tanpa dependensi native).
- **Label Output:** `'positif'`, `'netral'`, `'negatif'`, atau `null` (jika kata tidak dikenali).
- **Aturan Pemetaan:**
  - `positif` & `netral` $\rightarrow$ Saran keputusan: **`diterima`**.
  - `negatif` $\rightarrow$ Saran keputusan: **`ditolak`**.
  - `null` $\rightarrow$ `state: 'failed', errorCode: 'INVALID_RESPONSE'` (izin tetap berstatus `pending_review` untuk diperiksa manual oleh asisten lab).

Berkas integrasi aktif berada di:
`src/services/ai.ts`

---

## 2. Berkas Cadangan (Backup) HTTP AI API

Implementasi awal yang menghubungkan aplikasi ke server AI eksternal melalui protokol HTTP POST telah dicadangkan secara utuh di:
`src/services/ai.http-backup.ts`

### Fitur Cadangan HTTP:
- Menggunakan `fetch` ke endpoint `EXPO_PUBLIC_AI_URL` dengan header Authorization `Bearer ${EXPO_PUBLIC_AI_KEY}`.
- Batas waktu tunggu (*timeout*) 15 detik menggunakan `AbortController`.
- Mekanisme 1 kali retry otomatis untuk kode error `NETWORK` dan `HTTP_ERROR` (5xx).
- Parser JSON toleran terhadap pembungkus markdown code block (```json ... ```).
- Fallback anggun `NOT_CONFIGURED` bila URL belum diisi di `.env`.

---

## 3. Cara Beralih Kembali ke HTTP API (Bila Dibutuhkan)

Jika pengajar telah merilis endpoint API resmi dan menginstruksikan penggunaan HTTP API, cukup lakukan langkah berikut:

### Langkah 1: Aktifkan Modul HTTP
Ganti isi berkas `src/services/ai.ts` dengan isi dari berkas backup:
```bash
cp src/services/ai.http-backup.ts src/services/ai.ts
```

### Langkah 2: Isi Variabel Lingkungan (`.env`)
Pastikan variabel berikut telah diisi pada file `.env`:
```env
EXPO_PUBLIC_AI_URL=https://endpoint-resmi-pengajar.ac.id/v1/classify-izin
EXPO_PUBLIC_AI_KEY=kunci_api_anda
```

### Langkah 3: Verifikasi Kode
```bash
npx tsc --noEmit
```

Antarmuka pengguna (`IzinForm`, `DetailIzinScreen`, `AiSuggestionCard`) tidak perlu diubah sama sekali karena kedua adapter mematuhi kontrak tipe `classifyIzin(input): Promise<AiResult>` yang sama persis.
