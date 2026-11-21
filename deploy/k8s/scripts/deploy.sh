#!/usr/bin/env bash
# Roll the token-factory Deployment to one image tag and wait for it.
#   deploy.sh <tag>      tag = full commit SHA of an image already in GHCR
set -euo pipefail

TAG="${1:?usage: deploy.sh <image tag>}"
IMAGE="${IMAGE:-ghcr.io/vishwanetwork/token-factory}"
NAMESPACE=opennext
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for secret in token-factory-database token-factory-env ghcr-pull; do
  if ! kubectl -n "$NAMESPACE" get secret "$secret" >/dev/null 2>&1; then
    echo "Missing Secret $NAMESPACE/$secret; create it before deploying (see deploy/k8s/token-factory.yaml)." >&2
    exit 1
  fi
done

sed "s|IMAGE_PLACEHOLDER|${IMAGE}:${TAG}|" "$HERE/../token-factory.yaml" | kubectl apply -f -

if ! kubectl -n "$NAMESPACE" rollout status deployment/token-factory --timeout=10m; then
  echo "Rollout did not finish; recent pod state:" >&2
  kubectl -n "$NAMESPACE" get pods -l app=token-factory -o wide >&2 || true
  kubectl -n "$NAMESPACE" logs -l app=token-factory --tail=80 >&2 || true
  exit 1
fi
