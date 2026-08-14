#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Backend tests ==="
cd "$ROOT/backend"
npm test

echo ""
echo "=== Admin web tests ==="
cd "$ROOT/admin-web"
npm test

echo ""
echo "=== Driver app tests ==="
cd "$ROOT/driver_app"
flutter test

echo ""
echo "=== Parent app tests ==="
cd "$ROOT/parent_app"
flutter test

echo ""
echo "All test suites passed."
