#!/usr/bin/env bash
set -euo pipefail

#───────────────────────────────────────────
# build-ios.sh — Build Rawuh IPA for LiveContainer sideloading
#
# Usage:
#   ./scripts/build-ios.sh           # Cloud build + download + repackage to IPA
#   ./scripts/build-ios.sh --no-wait # Cloud build trigger only (check status online)
#   ./scripts/build-ios.sh --profile=sideload
#───────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/build"
PROFILE="sideload"
WAIT=true

for arg in "$@"; do
  case "$arg" in
    --no-wait) WAIT=false ;;
    --profile=*) PROFILE="${arg#*=}" ;;
    -h|--help)
      echo "Usage: ./scripts/build-ios.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --no-wait     Trigger EAS build and exit without waiting for completion"
      echo "  --profile=... Specify EAS build profile (default: sideload)"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════════╗"
echo "║   Rawuh iOS Build (LiveContainer / Sideload) ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Step 1: Check prerequisites
echo "→ [1/6] Memeriksa dependensi sistem..."
command -v node >/dev/null 2>&1 || { echo "✗ Node.js tidak ditemukan"; exit 1; }
command -v npx  >/dev/null 2>&1 || { echo "✗ npx tidak ditemukan"; exit 1; }
command -v zip  >/dev/null 2>&1 || { echo "✗ utility 'zip' tidak ditemukan"; exit 1; }
command -v tar  >/dev/null 2>&1 || { echo "✗ utility 'tar' tidak ditemukan"; exit 1; }
echo "  Node: $(node -v)"
echo "  npx:  $(npx -v)"
echo ""

# Step 2: Check .env file
echo "→ [2/6] Memeriksa file konfigurasi .env..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "✗ File .env tidak ditemukan! Salin .env.example dan lengkapi konfigurasi Firebase."
  exit 1
fi
echo "  .env terdeteksi ✓"
echo ""

# Step 3: Run Typecheck
echo "→ [3/6] Menjalankan TypeScript type check..."
npx tsc --noEmit
echo "  Type check lolos ✓"
echo ""

# Step 4: Run Lint
echo "→ [4/6] Menjalankan Expo linter..."
npx expo lint
echo "  Linting lolos ✓"
echo ""

mkdir -p "$BUILD_DIR"

# Step 5: Start EAS Cloud Build
if [ "$WAIT" = false ]; then
  echo "→ [5/6] Menjalankan EAS Cloud Build (--no-wait)..."
  npx -y eas-cli@latest build \
    --platform ios \
    --profile "$PROFILE" \
    --non-interactive \
    --no-wait
  echo ""
  echo "✓ Build berhasil di-trigger di EAS Cloud!"
  echo "  Pantau progress di https://expo.dev"
  echo "  Setelah selesai, unduh arsip build (.tar.gz) dan jalankan:"
  echo "  ./scripts/repackage-ipa.sh <path-arsip.tar.gz> build/rawuh.ipa"
  exit 0
fi

echo "→ [5/6] Memulai EAS Cloud Build (menunggu hingga selesai)..."
echo "  (Proses build di cloud memakan waktu beberapa menit)"
echo ""

RAW_JSON_OUTPUT="$BUILD_DIR/eas-build-output.json"
set +e
npx -y eas-cli@latest build \
  --platform ios \
  --profile "$PROFILE" \
  --non-interactive \
  --wait \
  --json > "$RAW_JSON_OUTPUT"
BUILD_EXIT_CODE=$?
set -e

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "✗ EAS build gagal dengan kode keluar $BUILD_EXIT_CODE."
  echo "  Periksa log di terminal atau dashboard Expo."
  exit $BUILD_EXIT_CODE
fi

# Step 6: Download artifact and Repackage
echo ""
echo "→ [6/6] Mengunduh hasil build dan mengonversi ke format .ipa..."

BUILD_URL=$(node -e "
  try {
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('$RAW_JSON_OUTPUT', 'utf8'));
    const item = Array.isArray(data) ? data[0] : data;
    console.log(item?.artifacts?.buildUrl || item?.artifacts?.applicationArchiveUrl || '');
  } catch(e) {
    console.log('');
  }
")

# Fallback: jika buildUrl kosong dari JSON, gunakan eas build:list
if [ -z "$BUILD_URL" ]; then
  echo "  Mencari tautan artefak terbaru melalui eas build:list..."
  BUILD_URL=$(npx -y eas-cli@latest build:list \
    --platform ios \
    --status finished \
    --limit 1 \
    --json 2>/dev/null | node -e "
      let d='';process.stdin.on('data',c=>d+=c);
      process.stdin.on('end',()=>{
        try {
          const b=JSON.parse(d);
          console.log(b[0]?.artifacts?.buildUrl || b[0]?.artifacts?.applicationArchiveUrl || '');
        } catch(e) { console.log(''); }
      })
    ")
fi

if [ -z "$BUILD_URL" ]; then
  echo "✗ Tidak dapat menemukan URL artefak build."
  echo "  Silakan buka https://expo.dev untuk mengunduh arsip secara manual,"
  echo "  kemudian jalankan: ./scripts/repackage-ipa.sh <file.tar.gz> build/rawuh.ipa"
  exit 1
fi

ARCHIVE_PATH="$BUILD_DIR/rawuh-build.tar.gz"
echo "  Mengunduh dari: $BUILD_URL"
curl -f -sL "$BUILD_URL" -o "$ARCHIVE_PATH"
echo "  Unduhan selesai ✓"

echo "  Mengemas ulang menjadi IPA untuk LiveContainer..."
"$SCRIPT_DIR/repackage-ipa.sh" "$ARCHIVE_PATH" "$BUILD_DIR/rawuh.ipa"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    ✅ BUILD BERHASIL!                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║ Lokasi File: build/rawuh.ipa                             ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║ Langkah Instalasi ke LiveContainer (iOS):                ║"
echo "║ 1. Kirim rawuh.ipa ke iPhone (AirDrop / Files / iCloud)  ║"
echo "║ 2. Buka aplikasi LiveContainer di iPhone                 ║"
echo "║ 3. Tekan tombol '+' di kanan atas -> Pilih 'Import IPA'  ║"
echo "║ 4. Pilih file rawuh.ipa yang baru ditransfer             ║"
echo "║ 5. Buka aplikasi Rawuh dari daftar LiveContainer         ║"
echo "╚══════════════════════════════════════════════════════════╝"
