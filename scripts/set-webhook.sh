#!/bin/bash
set -xeuo pipefail

source .env

curl "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -F "url=$BOT_HOOK" \
  -F 'drop_pending_updates=true' |
  jq
