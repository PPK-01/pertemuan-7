# DESIGN.md — Arah Desain: "Kartu Mahasiswa" (Rawuh)

Dokumen ini merupakan sumber kebenaran (*single source of truth*) untuk desain visual, token tema, dan struktur komponen aplikasi **Rawuh** (Presensi Praktikum dengan kode 4 digit). Semua AI agent dan developer yang menambahkan atau mengubah antarmuka wajib merujuk ke dokumen ini agar tampilan tetap kohesif, konsisten, dan memenuhi standar aksesibilitas WCAG AA.

---

## 1. Filosofi & Karakter Produk
Aplikasi dibangun di atas metafora **Kartu Tanda Mahasiswa & Portal Kampus Modern di HP**.
- **Nama Aplikasi:** **Rawuh**
- **Tagline:** Presensi praktikum dengan kode 4 digit.
- **Karakter Visual:** Resmi tapi ramah, tegas, mudah dikenali, tenang, dan tertib.
- **Hierarki Kedalaman:** **Zero drop-shadow** (tanpa bayangan melayang). Pemisahan bidang murni menggunakan perbedaan *fill tint* lembut dan *border* tipis bersudut membulat.

---

## 2. Palet Warna & Verifikasi Kontras (WCAG AA)

Sistem warna menggunakan Navy Pekat sebagai penanda resmi kampus dan Kuning Aksen sebagai identitas dinamis.

| Token | Nilai Hex | Peruntukan | Rasio Kontras Terverifikasi |
| :--- | :--- | :--- | :--- |
| `background` | `#F4F6FB` | Latar belakang aplikasi terang & tenang | — |
| `surface` | `#FFFFFF` | Permukaan kartu, panel kode, bottom sheet | — |
| `text` | `#0E1633` | Teks utama tinta gelap pekat (bukan hitam murni) | **16.44:1** thd background, **17.78:1** thd surface |
| `textMuted` | `#4B5675` | Teks sekunder, label pendukung, placeholder | **6.73:1** thd background, **7.27:1** thd surface |
| `border` | `#D5DAE8` | Garis tepi komponen & divider pemisah | — |
| `borderStrong` | `#7A84A0` | Garis tepi input field & radio sebelum aktif | **3.45:1** thd background (Lolos $\ge 3:1$) |
| `primary` | `#00144A` | Navy pekat untuk AppBar, IdentityCard, tombol utama | **17.52:1** thd `onPrimary` |
| `onPrimary` | `#FFFFFF` | Teks dan ikon di atas permukaan navy | — |
| `onPrimaryFaint` | `rgba(255, 255, 255, 0.08)` | Isian sel motif kode di atas navy | — |
| `onPrimarySubtle` | `rgba(255, 255, 255, 0.1)` | Isian lembut di atas navy (latar avatar `IdentityCard`) | — |
| `onPrimaryDivider` | `rgba(255, 255, 255, 0.12)` | Garis pemisah tipis di atas navy (tepi bawah `AppBar`) | — |
| `onPrimaryBorderSubtle` | `rgba(255, 255, 255, 0.25)` | Tepi elemen tidak aktif di atas navy (sel `CodeCells` signature) | — |
| `onPrimaryBorder` | `rgba(255, 255, 255, 0.4)` | Tepi tombol outline di atas navy (`IdentityCard`) | — |
| `accent` | `#FFC400` | Kuning aksen kampus | **10.97:1** thd navy `primary` |
| `accentSubtle` | `rgba(255, 196, 0, 0.12)` | Isian aksen lembut di atas navy (sel `CodeCells` signature aktif) | — |
| `onAccent` | `#00144A` | Teks navy di atas kuning aksen | **10.97:1** thd `accent` |
| `tile` | `#E3E7F2` | Latar ubin filter belum terpilih | — |
| `selectedSubtle` | `#E0E8FB` | Latar penanda item navigasi terpilih (pil ikon tab bar praktikan); nilainya sengaja sama dengan `feedback.info.bg` tetapi perannya berbeda | — |
| `surfaceMuted` | `#F7F8FC` | Permukaan kartu yang sedikit diredupkan dari `surface` (kartu status izin, ringkasan izin) | — |
| `overlay` | `rgba(0, 20, 74, 0.5)` | Backdrop modal BottomSheet | — |
| `disabled.bg` | `#E3E7F2` | Latar kontrol dinonaktifkan | — |
| `disabled.text` | `#66708C` | Teks kontrol dinonaktifkan | **3.98:1** thd `disabled.bg` |
| `status.scheduled` | `{ bg: '#FFF1C2', text: '#5E3B00' }` | Sesi Dijadwalkan (titik kosong) | **8.86:1** thd bg |
| `status.open` | `{ bg: '#DDF1E4', text: '#14603A' }` | Sesi Dibuka (titik penuh) | **6.43:1** thd bg |
| `status.closed` | `{ bg: '#E3E7F2', text: '#3A4560' }` | Sesi Ditutup (kotak) | **7.72:1** thd bg |
| `feedback.success` | `{ bg: '#DDF1E4', text: '#14603A' }` | Banner keberhasilan | **6.43:1** thd bg |
| `feedback.danger` | `{ bg: '#FBE3E1', text: '#A32119' }` | Banner kesalahan / gagal presensi | **6.16:1** thd bg |
| `feedback.info` | `{ bg: '#E0E8FB', text: '#1B2F8F' }` | Banner informasi umum | **9.25:1** thd bg |
| `feedback.warning` | `{ bg: '#FFE8CC', text: '#7A3D00' }` | Banner peringatan, banner offline "Tidak ada koneksi", penanda beda dari saran AI, saran AI perlu dicek | **7.08:1** thd bg |
| `feedbackBorder.info` | `#2A4AD0` | Garis tepi banner/kartu info, berpasangan dengan `feedback.info.bg` | — |
| `feedbackSubtle.success` | `{ bg: '#F2FAF5', border: '#A8DFBE' }` | Kartu status izin disetujui (lebih lembut dari banner) | — |
| `feedbackSubtle.danger` | `{ bg: '#FFF5F5', border: '#FFC7C7' }` | Kartu status izin ditolak (lebih lembut dari banner) | — |
| `izin.pending_ai` | `{ bg: '#E0E8FB', text: '#1B2F8F' }` | Izin sedang dianalisis, belum perlu tindakan ("Menunggu analisis") | **9.25:1** thd bg |
| `izin.pending_review` | `{ bg: '#FFE8CC', text: '#7A3D00' }` | Izin perlu diperiksa asisten ("Perlu diperiksa" / "Menunggu pemeriksaan asisten") | **7.08:1** thd bg |
| `izin.approved` | `{ bg: '#DDF1E4', text: '#14603A' }` | Izin disetujui asisten | **6.43:1** thd bg |
| `izin.rejected` | `{ bg: '#FBE3E1', text: '#A32119' }` | Izin ditolak asisten | **6.16:1** thd bg |

### Catatan Token Peringatan & Status Izin
- Peringatan memakai oranye-amber gelap di atas krem oranye, bukan kuning aksen, sehingga aturan kuning aksen di bawah tetap terjaga. Rona ini sengaja lebih hangat dari `status.scheduled` agar tidak tertukar dengan sesi Dijadwalkan.
- Banner offline tidak memiliki token khusus; memakai `feedback.warning` karena offline adalah kondisi yang perlu diperhatikan, bukan kesalahan pengguna.
- `izin.*` merujuk langsung ke `feedback.*` (info, warning, success, danger) agar makna warna konsisten di seluruh aplikasi.

### Aturan Keras Kuning Aksen (`#FFC400`)
- **BOLEH**: Digunakan di atas warna navy `#00144A` (sebagai ikon, teks kunci peran/kelas, atau tepi sel aktif pada panel navy), atau sebagai latar belakang dengan teks bertinta navy pekat `#00144A`.
- **DILARANG**: Digunakan sebagai teks, ikon, atau garis tepi di atas latar belakang putih (`#FFFFFF`) atau latar abu terang (`#F4F6FB`) karena kontrasnya tidak memenuhi standar WCAG.

---

## 3. Tipografi & Skala Teks

Menggunakan font sistem bawaan platform (*system font*) untuk menjamin performa tinggi dan rendering native yang tajam:
- `display`: `fontSize: 34`, `lineHeight: 40`, `fontWeight: '700'`
- `title`: `fontSize: 24`, `lineHeight: 30`, `fontWeight: '700'`
- `heading`: `fontSize: 18`, `lineHeight: 24`, `fontWeight: '600'`
- `body`: `fontSize: 16`, `lineHeight: 24`, `fontWeight: '400'`
- `label`: `fontSize: 14`, `lineHeight: 20`, `fontWeight: '600'`
- `caption`: `fontSize: 12`, `lineHeight: 16`, `fontWeight: '400'`
- `code`: `fontSize: 48`, `lineHeight: 56`, `fontWeight: '700'`, `fontVariant: ['tabular-nums']`

> **Aturan Token Teks:** Teks memakai satu token `typography.*` utuh (spread). Bila perlu satu nilai saja, ambil dari token (mis. `typography.body.fontSize`), bukan angka langsung. Angka tanpa padanan token ditulis sebagai konstanta bernama berkomentar di atas komponen. Pengecualian yang sudah ada: judul `AppBar` dan nama praktikum `SessionRow` merakit 16sp bold dari beberapa token karena tidak ada token tunggal untuknya.

> **Aturan Tabular:** Semua angka waktu, durasi, jumlah praktikan, dan digit kode sesi wajib menggunakan `fontVariant: ['tabular-nums']` agar karakter tidak bergeser saat nilainya berubah.

---

## 4. Spasial & Sudut (*Border Radius*)

- `spacing`: `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `xxl: 32`
- `radius`:
  - `sm: 6` (elemen kecil/detail)
  - `md: 10` (tombol, input text, card, banner, sel kode)
  - `lg: 16` (sudut atas bottom sheet modal)
  - `tile: 16` (ubin persegi membulat filter status)
  - `identity: 24` (kartu identitas mahasiswa/asisten)
  - `full: 999` (avatar inisial, badge status, chip, tombol bulat tengah)
- **Target Sentuh Minimum:** Semua elemen interaktif (tombol, baris, tab, input) wajib memiliki area sentuh $\ge 44\text{dp} \times 44\text{dp}$ (`layout.minTouch`).
- **Responsif Tablet:** Lebar konten pada tablet dibatasi maksimal $600\text{dp}$ terpusat (`layout.maxContentWidth`).
- **Jarak Rapat:** Jarak 2dp ditulis `spacing.xs / 2`, bukan angka langsung.
- **Garis Tepi:** Garis tepi kartu, banner, dan tombol 1dp; tepi fokus/error input 2dp. Belum ada token lebar garis, jadi ditulis sebagai konstanta `BORDER_WIDTH` di tiap komponen.
- **Baris Sempit:** Komponen dengan dua bagian berdampingan (`IzinRow`, aksi `BottomSheet`) menumpuk bila `width / fontScale < 360`, agar skala font besar tidak memeras teks.

---

## 5. Komponen Utama & Pola Antarmuka

### A. `AppBar`
- Latar navy pekat (`#00144A`) yang menyatu dengan status bar atas (`paddingTop: insets.top`).
- Judul tengah: default **"Presensi Praktikum"** (bold putih 16sp) dengan nama layar sebagai `subtitle` di bawahnya (`typography.caption`, putih diredupkan).
- Tombol kembali (chevron putih, `aria-label` "Kembali ke layar sebelumnya") tampil bila `canGoBack` dan `onGoBack` diberikan.
- Status bar perangkat diatur ke mode `<StatusBar style="light" />`.

### B. `IdentityCard`
- Kartu identitas bersudut membulat besar (`radius.identity: 24`) berlatar navy.
- Memuat:
  1. Avatar lingkaran inisial nama dengan border aksen kuning.
  2. Nama pengguna (bold putih).
  3. Baris kunci kuning `#FFC400` ("Kelas A" atau "Asisten Lab").
  4. Baris pendukung putih ("Praktikan" atau "Laboratorium Komputer").
  5. Tombol outline putih "Keluar" (`actionLabel` default). Sejak Sprint 2 tombol ini menggantikan "Ganti peran"; asisten membuka sheet konfirmasi keluar.

### C. Motif 4 Sel Kode (`CodeCells` & `CodeInput`)
- Motif tanda tangan 4 sel kotak terpisah:
  - **Login:** 4 sel kosong dengan sel pertama beraksen kuning.
  - **Detail Asisten (Dibuka):** Sprint 2 memakai kartu terang `SessionCodeCard` (digit `typography.display` tabular berjarak, nol di depan terjaga, dibacakan per digit). Varian panel navy 4 sel (`CodeCells variant="display-navy"`) tetap tersedia di UI kit.
  - **Input Praktikan:** 4 sel putih interaktif dengan fokus bergaris border navy 2dp, digerakkan oleh satu `TextInput` tersembunyi ber-`inputMode="numeric"`.

### D. Navigasi Bawah dengan Tombol Tengah Sadar-Konteks
- **Asisten:** Bar bawah berlatar terang dengan satu tombol bulat besar navy di tengah yang menonjol ke atas (`marginTop: -24`), ikon plus kuning di dalamnya, dan label "Buat sesi" di bawahnya.
- **Praktikan:** Tab Jadwal · Izin · Riwayat dengan tombol bulat aksi cepat "Isi kode" (`PraktikanTabBar`). Tombol aksi cepat sadar-konteks: langsung membuka detail sesi kelas yang sedang dibuka, atau memunculkan bottom sheet info jika belum ada sesi yang dibuka.

### E. Baris Sesi (`SessionRow`)
- Menampilkan data sesi sebagai kartu baris berpemisah bersih dan seragam.
- Memuat: Mata praktikum, badge status, topik, kelas & ruang, waktu berformat tabular, serta teks status bawah opsional ("Sudah presensi" / "x dari y hadir").
- Dilarang membungkus baris sesi ke dalam kontainer berbingkai ganda yang mempersempit lebar kartu.

### F. StatusBadge
- Selalu memadukan **teks label + bentuk geometris**:
  - **Dibuka:** Lingkaran penuh (titik solid) + teks hijau.
  - **Dijadwalkan:** Lingkaran kosong (garis tepi) + teks amber.
  - **Ditutup:** Kotak persegi + teks slate.
- Teks label selalu dari `STATUS_LABEL`; chip/ubin filter dan `aria-label` baris sesi memakai konstanta yang sama.

### G. Komponen Sprint 2

Semua komponen hanya menerima props: tidak mengimpor store, `services/`, atau `expo-router`, dan tidak tahu peran pengguna. Prop `style` khusus layout (margin, flex, alignSelf), bukan warna/ukuran.

| Komponen | Tujuan | Props utama | Aturan pakai & aksesibilitas |
| :--- | :--- | :--- | :--- |
| `Banner` | Pesan hasil aksi atau info di dalam layar | `tone` (`success`/`danger`/`info`), `message`, `title?` | `danger` memakai `role="alert"` dan diumumkan sekali ke TalkBack saat muncul; `info`/`success` memakai `aria-live="polite"` sehingga Banner statis tidak dibacakan setiap layar dibuka. Beri `key` baru per kegagalan agar kegagalan berulang tetap diumumkan. |
| `OfflineBanner` | Pita peringatan offline global di root layout | `isOnline`, `message?` | Memakai `feedback.warning`; pita, bukan overlay, dan menambah inset atas sendiri. Status koneksi dari pemanggil. |
| `LoadingState` | State memuat awal (gate auth, listener, kartu) | `label?`, `fullScreen?` | `role="progressbar"` + `aria-busy`; label terlihat sekaligus dibacakan. Label berakhiran elipsis "…", mis. "Memuat sesi…". |
| `SyncErrorState` | Error sinkronisasi listener dengan "Coba lagi" | `message`, `onRetry?`, `retrying?`, `compact?` | Warna `feedback.danger`; pesan `aria-live="polite"` (bukan alert, karena muncul tanpa aksi pengguna). `compact` untuk di dalam bagian layar; tombol turun ke baris berikut bila tidak muat. |
| `TextField` | Kolom input berlabel | `label`, `value`, `onChangeText`, `hint?`, `error?`, `disabled?`, `right?` | `error` menggantikan `hint` dan menebalkan tepi merah. Pesan terhubung ke input: `aria-describedby` di web; di native error digabung ke `aria-label` ("Topik, Topik wajib diisi") dan hint biasa lewat `accessibilityHint`. |
| `PasswordField` | `TextField` kata sandi dengan tombol "Tampilkan"/"Sembunyikan" | sama dengan `TextField`, `autoComplete` (`password`/`new-password`) | Tombol 44dp di sisi kanan dengan `aria-label` "Tampilkan kata sandi"/"Sembunyikan kata sandi". |
| `IzinStatusBadge` | Badge status izin | `status`, `size?` (`sm`/`md`) | Warna `colors.izin.*` + simbol (…, !, ✓, ✕) yang bentuknya beda dari titik status sesi. Label dari `IZIN_STATUS_LABEL`; status tak dikenal jatuh ke "Menunggu pemeriksaan asisten". |
| `IzinRow` | Baris daftar izin (asisten dan praktikan) | `izin`, `praktikanName`, `sessionLabel`, `onPress?` | Teks nama/sesi dirakit pemanggil. Dibaca sebagai satu kesatuan: nama, sesi, status. Header menumpuk di layar sempit. |
| `AiSuggestionCard` | Saran AI untuk izin | `ai?`, `onRetry?`, `retrying?`, `retryDisabled?` | Selalu berlabel "Eksperimental" dan memuat kalimat "Saran AI hanya bahan pertimbangan. Keputusan tetap di tangan asisten." Tiga keadaan: menunggu (memuat), gagal ("Coba lagi analisis AI" hanya bila `onRetry` ada), sukses (saran + kategori + sentimen). Warna saran: `success`/`danger`/`warning` (perlu dicek). |
| `Chip` | Pilihan tunggal (filter, praktikum, kelas) | `label`, `selected`, `onPress`, `disabled?` | `role="radio"` + `aria-checked`, bungkus dengan `role="radiogroup"` berlabel. Tinggi minimal 44dp. Pilihan terkunci tetap terbaca (`disabled.text` sebagai latar). |
| `BottomSheet` | Konfirmasi dan info di bawah layar | `visible`, `onClose`, `title`, `primaryAction?`, `secondaryAction?` | Fokus TalkBack pindah ke judul saat dibuka; overlay "Tutup" bisa diketuk; animasi buka 250ms / tutup 200ms dan mati bila "kurangi gerakan" aktif. Aksi berdampingan (batal kiri, utama kanan) atau bertumpuk di layar sempit. |

### H. Komponen Area Asisten (`src/features/asisten`)

- **Sheet konfirmasi** (`StatusActionSheet`, `DeleteSessionSheet`, `DeleteKelasSheet`, `KeluarSheet`, `IzinReviewSheet`): dibangun dari `BottomSheet`. Aksi utama memakai `loading` selama menulis; "Batal" ikut `disabled` saat loading. Aksi merusak (hapus, keluar, tolak) memakai variant `danger`.
- **`IzinReviewSheet`**: memuat nama praktikan, sesi, kalimat keputusan, kolom "Catatan untuk praktikan (opsional)", dan penanda warna `feedback.warning` bila keputusan berbeda dari saran AI `diterima`/`ditolak`.
- **`IzinShortcut` & `KelasShortcut`**: baris pintasan di beranda; badge jumlah izin memakai `izin.pending_review` dan hanya tampil saat jumlah sudah dimuat.

---

## 6. Pola Layar Asisten

- **Urutan state layar:** memuat (`LoadingState`) → error sinkronisasi (`SyncErrorState` + "Coba lagi") → kosong (`EmptyState`) → isi. "Coba lagi" hanya memasang ulang listener milik bagian layar itu; spinner berhenti setelah 10 detik tetapi tombol tetap tampil.
- **Banner error tulis:** hasil `Result` gagal dari aksi tulis ditampilkan sebagai `Banner tone="danger"` di atas form/layar dengan `key` baru per kegagalan. Pesan dari `writeErrorMessage` (teks SRS §4.3), ditimpa per fitur bila maknanya bergantung aksi (`sessionErrorMessage`, `kelasErrorMessage`, `izinErrorMessage`), mis. timeout saat membuat sesi meminta asisten mengecek daftar sesi dulu agar tidak ganda.
- **Validasi form:** pesan inline di tiap `TextField`/grup chip, ditambah satu `Banner` danger "Ada isian yang belum benar. Periksa pesan di tiap kolom." setelah percobaan simpan pertama.
- **Flash setelah kembali:** pesan sukses dari form (ubah sesi, tambah/ubah/hapus kelas) dititipkan lewat `setFlash`/`setSessionFlash` sebelum `router.back()`, lalu layar tujuan mengambilnya sekali dengan `takeFlash` dan menampilkannya sebagai `Banner tone="success"`.
- **Offline:** tombol tulis (Buka/Tutup sesi, Setujui/Tolak, Hapus, simpan form) `disabled` saat offline, dengan keterangan "Tidak ada koneksi internet. Aksi ini aktif lagi setelah tersambung." di bawahnya. Data terakhir tetap tampil.
- **Saran AI:** selalu dilabeli "Eksperimental"; keputusan akhir tetap tombol Setujui/Tolak asisten, termasuk saat AI belum selesai atau gagal.
- **Kode sesi Dibuka:** `SessionCodeCard` hanya tampil saat status Dibuka, memuat kodenya sendiri (memuat → kode, atau pesan "Kode sesi belum bisa dimuat…" bila offline/terlalu lama), dan menyebut kelas tujuan di petunjuknya.

---

## 7. Layar Auth (Login & Daftar)

- Kepala navy berisi nama aplikasi "Rawuh", tagline, dan motif 4 sel `CodeCells variant="signature-navy"`; form berada di lembar terang bersudut `radius.identity` di bawahnya.
- Teks di atas kepala navy memakai `onPrimary` (boleh diredupkan), bukan `textMuted`, karena `textMuted` di atas navy tidak memenuhi kontras 4.5:1.
- Input memakai `TextField`/`PasswordField`; error umum (`auth/*`, SRS §4.3) tampil sebagai `Banner tone="danger"`, kondisi offline sebagai `Banner tone="info"`.
- Pilihan peran dan kelas sebaiknya memakai `Chip` agar tinggi 44dp dan dibaca sebagai radio.

---

## 8. Aturan Larangan (*Anti-Slop Guidelines*)
1. DILARANG menggunakan gradien warna-warni generik (*generic AI gradient*).
2. DILARANG menggunakan efek bayangan (*drop-shadow* / *boxShadow* / *elevation*).
3. DILARANG menggunakan ALL-CAPS pada judul, nama, atau label tombol. Gunakan Sentence Case atau Title Case yang rapi.
4. DILARANG menggunakan emoji pada antarmuka, judul, tombol, banner, atau pesan error.
5. DILARANG menggunakan warna kuning di atas latar putih atau abu terang.
6. DILARANG menggunakan animasi memantul (*bounce effect*). Gunakan transisi lembut $\le 200\text{ms}$.

---

## 9. Catatan Kompatibilitas Expo SDK 57 & 58
- Seluruh komponen dirancang menggunakan primitif React Native dan Expo Router standar.
- Navigasi tab bar kustom menggunakan `router.push()` dan `useAppStore` sehingga kompatibel 100% di Expo SDK 57 tanpa perlu pembaruan dependensi `package.json`.

---

## 10. Catatan Terbuka

### Usulan Token untuk `src/theme`
| Usulan token | Nilai sekarang | Dipakai di |
| :--- | :--- | :--- |
| `borderWidth` (`hairline: 1`, `strong: 2`) | 1 / 1.5 / 2 | Konstanta `BORDER_WIDTH` di banyak komponen |

### Lainnya
- `Banner` belum punya tone `warning`; penanda beda dari saran AI dan sheet status masih memakai bingkai `feedback.warning` buatan sendiri.
- Animasi buka `BottomSheet` 250ms melebihi batas transisi ≤ 200ms di Aturan Larangan; perlu diputuskan apakah batasnya dilonggarkan untuk sheet atau durasinya diturunkan.
