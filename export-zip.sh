#!/usr/bin/env bash
# Generate a ZIP of the VisitigaMedia Absensi project (excluding node_modules, .next, etc.)
set -e

OUTPUT="visitigamedia-absensi.zip"
cd "$(dirname "$0")"

# Remove old zip
rm -f "$OUTPUT"

# Create zip excluding heavy/ephemeral dirs
zip -r "$OUTPUT" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x ".git/*" \
  -x "*.zip" \
  -x ".v3/*" \
  -x "package-lock.json" \
  > /dev/null

echo "Created $OUTPUT ($(du -h "$OUTPUT" | cut -f1))"
