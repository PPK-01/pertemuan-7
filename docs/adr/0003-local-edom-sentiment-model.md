# Local On-Device Sentiment Analysis (EDOM) for Leave Request Classification

## Konteks
Pada rencana awal Sprint 2, analisis izin praktikum dirancang menggunakan HTTP API eksternal yang disediakan pengajar. Namun spesifikasi endpoint tersebut belum final, dan asisten praktikum mengarahkan penggunaan paket model analisis sentimen lokal EDOM (Evaluasi Dosen oleh Mahasiswa) sesuai repositori acuan `Doctor3131/ppk-rn-expo-58`.

## Keputusan
Tim memutuskan mengintegrasikan Model EDOM (`ai/model-edom.json` dan `ai/sentiment.js`) sebagai mesin inferensi lokal murni di JavaScript untuk fitur izin praktikan:
1. Inferensi berjalan sepenuhnya di perangkat (*offline & zero-network*), menghilangkan risiko kegagalan jaringan atau ketergantungan API pihak ketiga selama praktikum.
2. Prediksi sentimen teks (`positif`, `netral`, `negatif`) dipetakan ke rekomendasi kelayakan izin (`diterima` atau `ditolak`) dengan deteksi kata kunci kategori (*sakit*, *keluarga*, *akademik*).
3. Implementasi HTTP API sebelumnya dicadangkan di `src/services/ai.http-backup.ts` agar dapat diaktifkan kembali sewaktu-waktu dengan pergantian adapter tanpa memengaruhi UI.
