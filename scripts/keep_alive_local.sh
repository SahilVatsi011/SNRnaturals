#!/bin/bash
# SNR Naturals — local Supabase keep-alive
#
# Supabase pauses FREE projects after 7 days without any API activity.
# This script sends one tiny read-only REST request to the project, which
# counts as activity. Combined with .github/workflows/keep_alive.yml this is
# the second of two independent nets (the GitHub one runs even if this Mac
# is off, this one runs even if GitHub Actions is down).
#
# Keys are read from .env.local at run time — nothing secret is stored here.
# Log: /tmp/snr-keepalive.log
#
# Install (runs every 3rd day at 06:00):
#   (crontab -l 2>/dev/null; echo "0 6 */3 * * /bin/bash $0") | crontab -

set -uo pipefail

ENV_FILE="${SNR_ENV_FILE:-/Users/macbook/Documents/client 1 Naturals/.env.local}"
LOG="${SNR_KEEPALIVE_LOG:-/tmp/snr-keepalive.log}"

if [ ! -f "$ENV_FILE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP: .env.local not found at $ENV_FILE" >> "$LOG"
  exit 0
fi

SUPA_URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
SUPA_KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')

if [ -z "$SUPA_URL" ] || [ -z "$SUPA_KEY" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') SKIP: Supabase URL/key missing in .env.local" >> "$LOG"
  exit 0
fi

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 \
  -H "apikey: ${SUPA_KEY}" \
  -H "Authorization: Bearer ${SUPA_KEY}" \
  "${SUPA_URL}/rest/v1/products?select=id&limit=1")

echo "$(date '+%Y-%m-%d %H:%M:%S') ping -> HTTP ${code} (${SUPA_URL})" >> "$LOG"