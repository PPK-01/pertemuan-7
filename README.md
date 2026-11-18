<p align="center">
  <img src="assets/branding/rawuh-animated-logo.svg" alt="Rawuh - Sistem Presensi Praktikum" width="100%">
</p>

<p align="center">
  <a href="https://docs.expo.dev/"><img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=flat-square&logo=expo&logoColor=white" alt="Expo SDK 57" /></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native 0.86" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Strict_Typed-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict" /></a>
  <a href="https://zustand-demo.pmnd.rs/"><img src="https://img.shields.io/badge/State-Zustand_5-443e38?style=flat-square" alt="Zustand 5" /></a>
  <a href="https://www.w3.org/WAI/WCAG21/quickref/"><img src="https://img.shields.io/badge/Accessibility-WCAG_AA_(4.5%3A1)-166534?style=flat-square" alt="WCAG AA" /></a>
</p>

---

## Ringkasan Proyek

**Rawuh** adalah aplikasi mobile pencatatan kehadiran sesi praktikum berbasis **React Native** dan **Expo SDK 57**. Didesain dengan filosofi **"Kartu Mahasiswa" (Identity Card UI)** yang mengedepankan presisi visual tanpa dekorasi bayangan berlebih (zero-shadow), aplikasi ini berjalan secara offline-first dengan dua perspektif peran pengguna: **Asisten Lab** dan **Praktikan**.

> [!NOTE]
> Proyek dirancang dengan pola *parallel development without merge conflicts*—pemisahan ketat kepemilikan berkas antara tim antarmuka (UI Kit & Layar Asisten) dan tim logika (Store & Layar Praktikan).

---

## Fitur Utama

### 1. Peran Asisten Lab
- **Manajemen Sesi Praktikum:** Membuat sesi baru lengkap dengan topik bahasan, ruang lab, tanggal, dan durasi.
- **Generator Token 4-Digit:** Menghasilkan kode token numerik 4-digit acak saat sesi dibuka untuk dimasukkan praktikan.
- **Tutup & Batalkan Sesi:** Mengakhiri sesi yang sedang berjalan atau membatalkan sesi sebelum dimulai.
- **Rekap Kehadiran Realtime:** Memantau daftar praktikan yang sudah hadir, izin, sakit, atau alpa, lengkap dengan penghitungan persentase kehadiran per sesi.

### 2. Peran Praktikan
- **Jadwal Sesi Terstruktur:** Menampilkan daftar sesi terjadwal, dibuka, maupun yang telah selesai menggunakan daftar tunggal efisien (`FlatList`).
- **Verifikasi Token 4-Digit:** Input token 4 sel otomatis (*auto-focus & backspace navigation*) untuk memvalidasi kehadiran.
- **Aksi Cepat Tombol Bulat:** Tombol navigasi bawah tengah (*context-aware center button*) langsung membuka sesi aktif yang sedang dibuka.
- **Riwayat & Status Presensi:** Memantau riwayat kehadiran lengkap dengan lencana status (Hadir, Terlambat, Izin, Sakit, Alpa).

### 3. Switch Peran Instan
- Berganti konteks pengguna antara Asisten dan Praktikan kapan saja tanpa alur login/logout yang memperlambat demonstrasi.

---

## Sistem Desain: "Kartu Mahasiswa"

Aplikasi Rawuh mematuhi panduan desain ketat yang terdokumentasi di [DESIGN.md](./DESIGN.md):

| Elemen | Token / Nilai | Penerapan |
| :--- | :--- | :--- |
| **Warna Utama (Navy)** | `#00144A` | `AppBar`, kartu identitas, tombol primer |
| **Aksen (Kuning)** | `#FFC400` | Garis aksen kartu, status dibuka, hanya di atas navy |
| **Latar Belakang** | `#F4F6FB` | Warna dasar layar (kanvas aplikasi) |
| **Permukaan Kartu** | `#FFFFFF` | Kontainer baris sesi, input field, bottom sheet |
| **Border & Pemisah** | `#E5E7EB` (1px) | Pengganti drop-shadow / elevation |
| **Target Sentuh** | Minimal 44 × 44 pt | Aksesibilitas tap target (WCAG 2.5.5) |
| **Rasio Kontras** | Minimal 4.5:1 | Teks normal memenuhi standar WCAG AA |

---

## Struktur Direktori

```text
rawuh/
├── assets/                           # Aset visual, ikon, & splash screen
│   └── branding/                     # Logo master & animasi SVG Rawuh
├── scripts/                          # Otomasi build iOS IPA, patching, & seed database
│   ├── build-ios.sh                  # One-click build sideload IPA iOS
│   ├── repackage-ipa.sh              # Ekstraksi & pembungkusan IPA
│   ├── patch-macho.py                # Binary patcher Mach-O (Simulator -> iOS)
│   ├── setup-eas-secrets.sh          # Sinkronisasi env Firebase ke EAS Secret
│   └── seed-firebase.js              # Script seeding data awal ke Firebase
├── src/
│   ├── app/                          # Expo Router file-based screens & navigasi
│   │   ├── _layout.tsx               # Root layout & route protection
│   │   ├── index.tsx                 # Selector switch peran & profil
│   │   ├── (auth)/                   # Layar login & registrasi asisten/praktikan
│   │   ├── asisten/                  # Layar & fitur asisten lab
│   │   └── praktikan/                # Layar & fitur praktikan (tabs & form presensi)
│   ├── components/                   # Komponen antarmuka (session & UI kit)
│   ├── config/                       # Konfigurasi runtime & Firebase environment
│   ├── features/                     # Modul logika fitur asisten & praktikan
│   ├── services/                     # Layanan API (Auth, Firestore, AI Model EDOM)
│   ├── store/                        # Global state management Zustand & realtime sync
│   └── theme/                        # Token desain (warna, tipografi, spasi)
├── docs/                             # Dokumentasi arsitektur, SRS, & panduan backup
├── firestore.rules                   # Aturan keamanan database Cloud Firestore
├── firestore.indexes.json            # Definisi composite index Firestore
├── IOS_LIVECONTAINER_GUIDE.md        # Panduan instalasi sideload iOS & notifikasi Bark
├── DESIGN.md                         # Spesifikasi lengkap desain sistem Rawuh
└── package.json
```

---

## Memulai Cepat

### Prasyarat
- Node.js versi 18 atau lebih baru (direkomendasikan Node.js 20+).
- Aplikasi **Expo Go** pada perangkat fisik atau simulator Android / iOS.
- Akun Firebase (atau gunakan mode fallback in-memory).

### 1. Salin Konfigurasi Environment
```bash
cp .env.example .env
```
Lengkapi 6 variabel `EXPO_PUBLIC_FIREBASE_*` di file `.env`. Untuk menjalankan skrip seed database, sertakan juga kode undangan asisten:
```env
ASISTEN_INVITE_CODE=kode_undangan_rahasia
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. (Opsional) Seeding Data Awal ke Firebase
```bash
node scripts/seed-firebase.js
```

### 4. Menjalankan Server Pengembangan
```bash
npx expo start
```
- Tekan `a` untuk membuka Android Emulator.
- Tekan `i` untuk membuka iOS Simulator.
- Pindai kode QR menggunakan aplikasi **Expo Go** untuk pengujian langsung di ponsel.

---

## Panduan Build Aplikasi (Android & iOS)

Aplikasi Rawuh mendukung pembuatan binary mandiri untuk Android (`.apk`) dan iOS (`.ipa`) menggunakan EAS Build dan skrip otomasi lokal.

### 1. Build Android

#### A. Standalone APK (Rekomendasi untuk Dibagikan ke HP Android)
Membuat file installer `.apk` mandiri via EAS Cloud tanpa memerlukan Android Studio di komputer lokal:
```bash
npx eas-cli build --platform android --profile preview
```
*Output*: Tautan unduhan berkas `.apk` langsung dari server EAS yang dapat dipasang di smartphone Android manapun.

#### B. Development Build (Custom Dev Client Android)
Untuk pengujian modul native selama masa pengembangan:
```bash
npx eas-cli build --platform android --profile development
```

#### C. Local Build Android (Memerlukan Android Studio & Android SDK)
```bash
npm run android
# atau: npx expo run:android
```

---

### 2. Build iOS

#### A. Sideload IPA untuk LiveContainer / TrollStore / Sideloadly (Rekomendasi)
Metode ini memungkinkan pembuatan file `.ipa` produksi **tanpa memerlukan akun Apple Developer berbayar ($99/tahun)** dan dapat dipasang langsung di iPhone fisik via **LiveContainer** (bebas dari batasan 3-app sideload limit).

Jalankan perintah satu baris berikut:
```bash
npm run build:ios
```
Skrip ini akan secara otomatis:
1. Memeriksa kredensial EAS dan dependensi lokal (`ldid`, `python3`).
2. Menjalankan build rilis simulator di EAS Cloud (`profile: sideload`).
3. Mengunduh artifact `.tar.gz` dan mengekstrak direktori `.app`.
4. Melakukan binary patching pada header Mach-O eksekutabel utama (`Rawuh`) serta seluruh **14 dynamic framework** (mengubah target platform dari `7` [iOS Simulator] ke `2` [iOS Device]).
5. Menerapkan ad-hoc signature dan mengemas ulang menjadi berkas `build/rawuh.ipa`.

> [!TIP]
> Panduan lengkap langkah demi langkah instalasi di iPhone dan konfigurasi notifikasi push Bark dapat dibaca di **[IOS_LIVECONTAINER_GUIDE.md](./IOS_LIVECONTAINER_GUIDE.md)**.

Jika ingin menjalankan build di latar belakang tanpa menunggu proses selesai di terminal:
```bash
npm run build:ios:nowait
```

#### B. Development Build iOS (EAS Cloud)
```bash
npx eas-cli build --platform ios --profile development
```

#### C. Local Build iOS (Khusus macOS dengan Xcode)
```bash
npm run ios
# atau: npx expo run:ios
```

---

### 3. Setup Rahasia EAS (Sinkronisasi Environment)
Sebelum menjalankan build di EAS Cloud, pastikan variabel Firebase dari file `.env` lokal telah disinkronkan ke EAS Secrets:
```bash
npm run build:setup-secrets
```

---

## Verifikasi & Kualitas Kode

Jalankan serangkaian pemeriksaan kualitas kode sebelum melakukan pengiriman:

```bash
# Pemeriksaan linter ESLint
npm run lint

# Pemeriksaan tipe statis TypeScript
npm run typecheck

# Pemeriksaan kesehatan konfigurasi dan SDK Expo
npx expo-doctor
```

> [!TIP]
> Seluruh antarmuka telah diverifikasi kompatibel pada Expo SDK 57 dan siap diadaptasi ke Expo SDK 58 tanpa perubahan arsitektur data.
