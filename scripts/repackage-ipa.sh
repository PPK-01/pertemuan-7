#!/usr/bin/env bash
set -euo pipefail

#───────────────────────────────────────────
# repackage-ipa.sh — Convert EAS simulator .tar.gz -> sideloadable .ipa
#
# Usage: ./scripts/repackage-ipa.sh <input.tar.gz> <output.ipa>
#───────────────────────────────────────────

INPUT="${1:?Usage: repackage-ipa.sh <input.tar.gz> <output.ipa>}"
OUTPUT_ARG="${2:?Usage: repackage-ipa.sh <input.tar.gz> <output.ipa>}"

# Ensure absolute paths
if [[ "$INPUT" != /* ]]; then
  INPUT="$(pwd)/$INPUT"
fi

OUTPUT_DIR="$(dirname "$OUTPUT_ARG")"
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR_ABS="$(cd "$OUTPUT_DIR" && pwd)"
OUTPUT="$OUTPUT_DIR_ABS/$(basename "$OUTPUT_ARG")"

if [ ! -f "$INPUT" ]; then
  echo "✗ Input archive not found: $INPUT"
  exit 1
fi

TMPDIR_WORK=$(mktemp -d)
trap 'rm -rf "$TMPDIR_WORK"' EXIT

echo "→ Extracting $INPUT..."
tar -xzf "$INPUT" -C "$TMPDIR_WORK"

# Find the .app bundle
APP_PATH=$(find "$TMPDIR_WORK" -name "*.app" -maxdepth 2 -type d | head -1)
if [ -z "$APP_PATH" ]; then
  echo "✗ No .app bundle found in archive"
  exit 1
fi

APP_NAME=$(basename "$APP_PATH")
echo "  Found: $APP_NAME"

# Create Payload structure
PAYLOAD_DIR="$TMPDIR_WORK/Payload"
mkdir -p "$PAYLOAD_DIR"
cp -R "$APP_PATH" "$PAYLOAD_DIR/"

# Create IPA (zip archive with Payload/ containing .app)
echo "→ Creating IPA..."
cd "$TMPDIR_WORK"
zip -qr "$OUTPUT" Payload/
cd - > /dev/null

echo "✓ IPA created: $OUTPUT"
echo "  Size: $(du -h "$OUTPUT" | cut -f1)"
