#!/usr/bin/env bash
set -euo pipefail

#───────────────────────────────────────────
# setup-eas-secrets.sh — Unggah konfigurasi Firebase dari .env ke EAS Environment Variables
# Jalankan sekali sebelum build cloud pertama atau GitHub Actions
#
# Hanya variabel EXPO_PUBLIC_FIREBASE_* yang dikirim. Variabel lain di .env
# (mis. ASISTEN_INVITE_CODE untuk script seed) tidak dibutuhkan aplikasi dan
# tidak boleh ikut terunggah.
#───────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
  echo "✗ File .env tidak ditemukan! Salin .env.example dan lengkapi konfigurasi Firebase terlebih dahulu." >&2
  exit 1
fi

ENVIRONMENTS=(preview production)
EAS=(npx -y eas-cli@latest)

# Kumpulkan pasangan NAMA=nilai khusus EXPO_PUBLIC_FIREBASE_* dari .env.
names=()
values=()
while IFS= read -r line || [ -n "$line" ]; do
  line="${line%$'\r'}"
  if [[ "$line" =~ ^[[:space:]]*(EXPO_PUBLIC_FIREBASE_[A-Z0-9_]+)[[:space:]]*=(.*)$ ]]; then
    name="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    # Buang spasi di tepi dan tanda kutip pembungkus (cara yang sama dengan parser .env di seed).
    value="$(printf '%s' "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e "s/^[\"']//" -e "s/[\"']$//")"
    if [ -z "$value" ]; then
      echo "✗ $name kosong di .env. Lengkapi semua variabel EXPO_PUBLIC_FIREBASE_* lalu jalankan ulang." >&2
      exit 1
    fi
    names+=("$name")
    values+=("$value")
  fi
done < .env

# Keenam variabel wajib ada; sama dengan daftar yang dicek src/config/env.ts dan script seed.
REQUIRED=(
  EXPO_PUBLIC_FIREBASE_API_KEY
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  EXPO_PUBLIC_FIREBASE_PROJECT_ID
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  EXPO_PUBLIC_FIREBASE_APP_ID
)
missing=()
for required in "${REQUIRED[@]}"; do
  found=false
  for name in ${names[@]+"${names[@]}"}; do
    if [ "$name" = "$required" ]; then
      found=true
      break
    fi
  done
  if [ "$found" = false ]; then
    missing+=("$required")
  fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "✗ Variabel berikut belum ada di .env: ${missing[*]}" >&2
  echo "  Lengkapi semua variabel EXPO_PUBLIC_FIREBASE_* (lihat .env.example) lalu jalankan ulang." >&2
  exit 1
fi

echo "→ Mengunggah ${#names[@]} variabel Firebase ke EAS (${ENVIRONMENTS[*]})..."
echo "  (Pastikan kamu sudah login via 'npx eas-cli login')"
echo ""

env_flags=()
for environment in "${ENVIRONMENTS[@]}"; do
  env_flags+=(--environment "$environment")
done

for i in "${!names[@]}"; do
  name="${names[$i]}"
  echo "  • $name"
  # Visibilitas plaintext disengaja: awalan EXPO_PUBLIC_ membuat nilainya ditanam ke bundle
  # aplikasi dan bisa dibaca siapa pun yang memegang APK/IPA, jadi menandainya sensitive/secret
  # tidak menambah perlindungan. Nilai rahasia sungguhan tidak boleh memakai awalan EXPO_PUBLIC_.
  # --force menimpa variabel yang sudah ada dengan nama yang sama.
  if ! "${EAS[@]}" env:create \
    --name "$name" \
    --value "${values[$i]}" \
    "${env_flags[@]}" \
    --scope project \
    --type string \
    --visibility plaintext \
    --force \
    --non-interactive; then
    echo "" >&2
    echo "✗ Gagal mengunggah $name ke EAS. Periksa login ('npx eas-cli whoami') dan pesan error di atas." >&2
    exit 1
  fi
done

echo ""
echo "✓ Konfigurasi Firebase berhasil diunggah ke EAS."
echo "  EAS Cloud Build akan menanamkan variabel EXPO_PUBLIC_FIREBASE_* ke dalam bundle aplikasi."
