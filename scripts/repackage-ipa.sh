#!/usr/bin/env bash
set -euo pipefail

#───────────────────────────────────────────
# repackage-ipa.sh — Convert EAS simulator .tar.gz -> sideloadable .ipa
# Patches Mach-O platform from iOS-simulator -> physical iOS for LiveContainer.
#
# Usage: ./scripts/repackage-ipa.sh <input.tar.gz> <output.ipa>
#───────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
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

# Locate main executable
EXEC_NAME=""
if [ -f "$APP_PATH/Info.plist" ] && command -v plutil >/dev/null 2>&1; then
  EXEC_NAME=$(plutil -extract CFBundleExecutable raw "$APP_PATH/Info.plist" 2>/dev/null || true)
fi
if [ -z "$EXEC_NAME" ]; then
  EXEC_NAME="${APP_NAME%.app}"
fi

MAIN_EXEC="$APP_PATH/$EXEC_NAME"
if [ ! -f "$MAIN_EXEC" ]; then
  # Fallback: search for first Mach-O executable
  MAIN_EXEC=$(find "$APP_PATH" -maxdepth 1 -type f -perm +111 | head -1)
fi

echo "  Target binary: $(basename "$MAIN_EXEC")"

# Step: Thin binary to arm64 if lipo is available (physical iPhones only run arm64)
if command -v lipo >/dev/null 2>&1 && lipo -info "$MAIN_EXEC" 2>&1 | grep -q "arm64"; then
  echo "→ Thinning binary to arm64..."
  lipo -thin arm64 "$MAIN_EXEC" -output "$MAIN_EXEC.arm64" 2>/dev/null && mv "$MAIN_EXEC.arm64" "$MAIN_EXEC" || true
fi

# Step: Patch Mach-O platform headers (iOS-simulator -> physical iOS)
echo "→ Patching Mach-O headers for LiveContainer..."
python3 "$SCRIPT_DIR/patch-macho.py" "$MAIN_EXEC"

# Find any nested dylibs or frameworks and patch them too if present
while IFS= read -r f; do
  [ -f "$f" ] && python3 "$SCRIPT_DIR/patch-macho.py" "$f" 2>/dev/null || true
done < <(find "$APP_PATH" -type f \( -name "*.dylib" -o -name "*.framework" \))

# Step: Re-sign ad-hoc if codesign is available
if command -v codesign >/dev/null 2>&1; then
  echo "→ Applying ad-hoc code signature..."
  codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true
fi

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
