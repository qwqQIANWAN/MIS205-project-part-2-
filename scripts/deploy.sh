#!/usr/bin/env bash

set -euo pipefail

BRANCH="${1:-main}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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
docker-compose -f docker/docker-compose.yml up -d --build

echo "Deployment completed."
