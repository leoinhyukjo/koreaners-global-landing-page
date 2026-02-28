#!/bin/bash
# Blog Sync Trigger - Notion → Supabase 동기화
# launchd에서 하루 2회 호출

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# .env.local에서 SYNC_SECRET 읽기
SYNC_SECRET=$(grep '^SYNC_SECRET=' "$PROJECT_ROOT/.env.local" | cut -d'=' -f2-)

if [ -z "$SYNC_SECRET" ]; then
    echo "[ERROR] SYNC_SECRET not found in .env.local"
    exit 1
fi

SITE_URL="${SITE_URL:-https://www.koreaners.co}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Triggering blog sync to ${SITE_URL}..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "${SITE_URL}/api/sync/blog" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SYNC_SECRET}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "[OK] Sync complete: $BODY"
else
    echo "[ERROR] HTTP $HTTP_CODE: $BODY"
    exit 1
fi
