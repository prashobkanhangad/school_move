#!/usr/bin/env bash
# Live smoke tests against a running backend (default localhost:5001)
set -euo pipefail

BASE="${API_BASE:-http://localhost:5001/api/v1}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local cond="$2"
  if eval "$cond"; then
    echo "PASS  $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Live API smoke: $BASE ==="

HEALTH=$(curl -s -o /tmp/sb_health.json -w "%{http_code}" http://localhost:5001/health || true)
check "health endpoint" "[[ \"$HEALTH\" == \"200\" ]]"

SUPER=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@platform.com","password":"Super@12345"}')
SUPER_TOKEN=$(echo "$SUPER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null || true)
SUPER_ROLE=$(echo "$SUPER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('user',{}).get('role',''))" 2>/dev/null || true)
check "super admin login" "[[ \"$SUPER_ROLE\" == \"SUPER_ADMIN\" && -n \"$SUPER_TOKEN\" ]]"

ADMIN=$(curl -s -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@greenvalley.edu","password":"Admin@12345"}')
ADMIN_TOKEN=$(echo "$ADMIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null || true)
ADMIN_SCHOOL=$(echo "$ADMIN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('user',{}).get('schoolId',''))" 2>/dev/null || true)
check "school admin login" "[[ -n \"$ADMIN_TOKEN\" && -n \"$ADMIN_SCHOOL\" ]]"

SCHOOLS_CODE=$(curl -s -o /tmp/sb_schools.json -w "%{http_code}" \
  -H "Authorization: Bearer $SUPER_TOKEN" "$BASE/schools")
check "super lists schools" "[[ \"$SCHOOLS_CODE\" == \"200\" ]]"

ADMIN_SCHOOLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/schools")
check "school admin cannot list all schools" "[[ \"$ADMIN_SCHOOLS_CODE\" == \"403\" ]]"

STATS_CODE=$(curl -s -o /tmp/sb_platform.json -w "%{http_code}" \
  -H "Authorization: Bearer $SUPER_TOKEN" "$BASE/platform/stats")
check "platform stats" "[[ \"$STATS_CODE\" == \"200\" ]]"

NO_HEADER=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $SUPER_TOKEN" "$BASE/drivers")
check "super without X-School-Id gets 400" "[[ \"$NO_HEADER\" == \"400\" ]]"

WITH_HEADER=$(curl -s -o /tmp/sb_drivers.json -w "%{http_code}" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "X-School-Id: $ADMIN_SCHOOL" \
  "$BASE/drivers")
check "super with X-School-Id lists drivers" "[[ \"$WITH_HEADER\" == \"200\" ]]"

MON_CODE=$(curl -s -o /tmp/sb_mon.json -w "%{http_code}" \
  -H "Authorization: Bearer $SUPER_TOKEN" \
  -H "X-School-Id: $ADMIN_SCHOOL" \
  "$BASE/monitoring/stats")
check "super monitoring stats in school context" "[[ \"$MON_CODE\" == \"200\" ]]"

OWN_SCHOOL=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE/schools/$ADMIN_SCHOOL")
check "school admin can get own school" "[[ \"$OWN_SCHOOL\" == \"200\" ]]"

PUBLIC_CREATE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/schools" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Hack","code":"HACK99","address":"x street","city":"c","state":"s","timezone":"Asia/Kolkata"}')
check "public school create blocked" "[[ \"$PUBLIC_CREATE\" == \"401\" ]]"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ "$FAIL" -eq 0 ]]
