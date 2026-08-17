#!/usr/bin/env bash
# Build Play Store Android App Bundles for parent + driver.
# Usage:
#   ./scripts/build-play-aabs.sh
# Optional overrides:
#   export API_BASE_URL=https://schoolmovebackend.techweo.com/api/v1
#   export SOCKET_URL=https://schoolmovebackend.techweo.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

API_BASE_URL="${API_BASE_URL:-https://schoolmovebackend.techweo.com/api/v1}"
SOCKET_URL="${SOCKET_URL:-https://schoolmovebackend.techweo.com}"
echo "API_BASE_URL=$API_BASE_URL"
echo "SOCKET_URL=$SOCKET_URL"

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
