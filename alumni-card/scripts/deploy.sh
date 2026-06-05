#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(git -C "$PROJECT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "Error: docker compose is not installed."
    exit 1
  fi
}

remove_matching_containers() {
  local pattern="$1"
  local ids

  ids="$(docker ps -aq --filter "name=${pattern}" 2>/dev/null || true)"
  if [ -n "$ids" ]; then
    echo "Removing stale containers matching ${pattern} ..."
    for id in $ids; do
      docker rm -f "$id" >/dev/null
    done
  fi
}

if [ -z "$REPO_ROOT" ]; then
  echo "Error: cannot locate Git repository from $PROJECT_DIR"
  exit 1
fi

if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "Error: .env not found in $PROJECT_DIR"
  exit 1
fi

echo "Fetching latest code from origin/$BRANCH ..."
cd "$REPO_ROOT"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Rebuilding and restarting containers ..."
remove_matching_containers "alumni_backend"
remove_matching_containers "alumni_nginx"
compose_cmd --env-file "$PROJECT_DIR/.env" -f "$PROJECT_DIR/docker/docker-compose.yml" up -d --build --remove-orphans

echo "Deployment completed."
