#!/usr/bin/env bash
# Build Play Store Android App Bundles for parent + driver.
# Usage:
#   export API_BASE_URL=https://api.example.com/api/v1
#   export SOCKET_URL=https://api.example.com
#   ./scripts/build-play-aabs.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${API_BASE_URL:-}" || -z "${SOCKET_URL:-}" ]]; then
  echo "Set production URLs first:"
  echo "  export API_BASE_URL=https://your-api.example.com/api/v1"
  echo "  export SOCKET_URL=https://your-api.example.com"
  exit 1
fi

if [[ "$API_BASE_URL" == http://* || "$SOCKET_URL" == http://* ]]; then
  echo "Play release builds must use HTTPS URLs."
  exit 1
fi

build_app() {
  local app="$1"
  local extra=()
  if [[ "$app" == "parent_app" && -n "${GOOGLE_MAPS_API_KEY:-}" ]]; then
    extra+=(--dart-define="GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY")
  fi
  echo "Building $app AAB…"
  (
    cd "$ROOT/$app"
    flutter pub get
    flutter build appbundle --release \
      --obfuscate \
      --split-debug-info=build/symbols \
      --dart-define="API_BASE_URL=$API_BASE_URL" \
      --dart-define="SOCKET_URL=$SOCKET_URL" \
      "${extra[@]}"
  )
  echo "AAB: $ROOT/$app/build/app/outputs/bundle/release/app-release.aab"
}

build_app parent_app
build_app driver_app
echo "Upload both AAB files in Play Console (Internal testing first)."
