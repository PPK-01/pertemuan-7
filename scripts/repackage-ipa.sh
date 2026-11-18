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

# Collect ALL Mach-O binaries: main executable + framework executables + dylibs
echo "→ Scanning for Mach-O binaries..."
MACHO_FILES=()
MACHO_FILES+=("$MAIN_EXEC")

# Find executables inside .framework directories
while IFS= read -r fw_dir; do
  fw_name=$(basename "$fw_dir" .framework)
  fw_exec="$fw_dir/$fw_name"
  if [ -f "$fw_exec" ]; then
    MACHO_FILES+=("$fw_exec")
  fi
done < <(find "$APP_PATH" -name "*.framework" -type d)

# Find standalone .dylib files
while IFS= read -r dylib; do
  MACHO_FILES+=("$dylib")
done < <(find "$APP_PATH" -type f -name "*.dylib")

echo "  Found ${#MACHO_FILES[@]} Mach-O binaries to process"

# Step: Thin all binaries to arm64 and patch platform headers
for macho in "${MACHO_FILES[@]}"; do
  macho_name=$(basename "$macho")
  echo "  Processing: $macho_name..."
  # Thin to arm64 (iPhone physical arch only)
  if command -v lipo >/dev/null 2>&1 && lipo -info "$macho" 2>&1 | grep -q "arm64"; then
    lipo -thin arm64 "$macho" -output "$macho.arm64" 2>/dev/null && mv "$macho.arm64" "$macho" || true
  fi
  # Patch platform header
  python3 "$SCRIPT_DIR/patch-macho.py" "$macho"
done

# Step: Re-sign ad-hoc if codesign is available
if command -v codesign >/dev/null 2>&1; then
  echo "→ Applying ad-hoc code signature..."
  # Sign frameworks first, then main app
  find "$APP_PATH/Frameworks" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | while read -r fw; do
    codesign --force --deep --sign - "$fw" 2>/dev/null || true
  done
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
