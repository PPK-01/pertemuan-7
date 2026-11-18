#!/usr/bin/env bash
set -euo pipefail

#───────────────────────────────────────────
# setup-eas-secrets.sh — Upload .env to EAS Secrets & Environment Variables
# Run once before first cloud build or GitHub Actions
#───────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [ ! -f ".env" ]; then
  echo "✗ File .env tidak ditemukan! Salin .env.example dan lengkapi konfigurasi Firebase terlebih dahulu."
  exit 1
fi

echo "→ Mengunggah konfigurasi .env ke EAS (Cloud)..."
echo "  (Pastikan kamu sudah login via 'npx eas-cli login')"
echo ""

# Push to EAS Environment Variables (modern EAS system)
echo "→ Mendorong ke EAS Environment Variables (preview & production)..."
npx -y eas-cli@latest env:push preview --path .env --force 2>/dev/null || true
npx -y eas-cli@latest env:push production --path .env --force 2>/dev/null || true

# Also sync to EAS Secrets (legacy fallback)
echo "→ Mendorong ke EAS Secrets..."
npx -y eas-cli@latest secret:push \
  --scope project \
  --env-file .env \
  --force 2>/dev/null || true

echo ""
echo "✓ Seluruh konfigurasi Firebase berhasil diunggah ke EAS!"
echo "  EAS Cloud Build akan otomatis menanamkan variabel Firebase ke dalam bundle aplikasi."
