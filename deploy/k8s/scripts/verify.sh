#!/usr/bin/env bash
# Check the running release.
#   verify.sh            ask the Service from inside the cluster
#   verify.sh --public   ask https://gateway.opennextlab.ai
set -euo pipefail

NAMESPACE=opennext
HOST=gateway.opennextlab.ai

if [ "${1:-}" = "--public" ]; then
  body="$(curl -fsS --max-time 20 "https://${HOST}/api/status")"
else
  # Reads through the API server proxy, so no extra pod is started.
  body="$(kubectl get --raw "/api/v1/namespaces/${NAMESPACE}/services/token-factory:http/proxy/api/status")"
fi

if ! printf '%s' "$body" | grep -Eq '"success":[[:space:]]*true'; then
  echo "Unexpected /api/status response:" >&2
  printf '%s\n' "$body" | head -c 500 >&2
  exit 1
fi
echo "token-factory is serving /api/status"
