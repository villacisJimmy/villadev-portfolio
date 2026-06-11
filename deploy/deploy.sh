#!/usr/bin/env bash
# deploy.sh — pull image + recreate container. Runs on the VPS as villadev.
set -euo pipefail

cd /srv/villadev

if [ ! -f .env ]; then
  echo "ERROR: /srv/villadev/.env missing"
  exit 1
fi

: "${GHCR_OWNER:?GHCR_OWNER required}"
: "${GHCR_REPO:?GHCR_REPO required}"
: "${TAG:=latest}"
export GHCR_OWNER GHCR_REPO TAG

# Login a GHCR si la imagen es privada (token en /srv/villadev/.ghcr_token, mode 600)
if [ -f /srv/villadev/.ghcr_token ]; then
  cat /srv/villadev/.ghcr_token | docker login ghcr.io -u "${GHCR_OWNER}" --password-stdin
fi

docker compose -f compose.yaml pull
docker compose -f compose.yaml up -d --remove-orphans

# Esperar healthy hasta 90s
for i in $(seq 1 30); do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' villadev-app 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "OK"
    break
  fi
  if [ "$STATUS" = "unhealthy" ]; then
    echo "FAIL: unhealthy"
    docker logs --tail 100 villadev-app
    exit 1
  fi
  sleep 3
done

docker image prune -af --filter "until=72h" || true
echo "deploy ${TAG} done"
