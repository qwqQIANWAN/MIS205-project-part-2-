#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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

cd "$PROJECT_DIR"

if [ ! -d .git ]; then
  echo "Error: $PROJECT_DIR is not a Git repository."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Error: .env not found in $PROJECT_DIR"
  exit 1
fi

echo "Fetching latest code from origin/$BRANCH ..."
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "Rebuilding and restarting containers ..."
compose_cmd -f docker/docker-compose.yml up -d --build --remove-orphans

echo "Deployment completed."
