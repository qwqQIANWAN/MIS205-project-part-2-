#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bash scripts/server-bootstrap.sh <github_repo_url> [branch]"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"
TARGET_DIR="${TARGET_DIR:-/home/ubuntu/apps/alumni-card}"
BACKUP_ROOT="${BACKUP_ROOT:-$HOME/apps-backup}"
BACKUP_DIR=""

compose_cmd() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    return 1
  fi
}

echo "Preparing target directory: $TARGET_DIR"
mkdir -p "$(dirname "$TARGET_DIR")"

if [ -d "$TARGET_DIR/.git" ]; then
  echo "Git repository already exists at $TARGET_DIR"
else
  if [ -d "$TARGET_DIR" ]; then
    BACKUP_DIR="$BACKUP_ROOT/alumni-card-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_ROOT"

    if [ -f "$TARGET_DIR/docker/docker-compose.yml" ]; then
      echo "Stopping existing manual deployment ..."
      (
        cd "$TARGET_DIR"
        compose_cmd -f docker/docker-compose.yml down || true
      )
    fi

    echo "Backing up existing directory to $BACKUP_DIR"
    mv "$TARGET_DIR" "$BACKUP_DIR"
  fi

  git clone -b "$BRANCH" "$REPO_URL" "$TARGET_DIR"

  if [ -n "$BACKUP_DIR" ] && [ -f "$BACKUP_DIR/.env" ] && [ ! -f "$TARGET_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" "$TARGET_DIR/.env"
    echo "Restored existing .env from $BACKUP_DIR/.env"
  fi
fi

cd "$TARGET_DIR"

echo "Repository ready at $TARGET_DIR"
echo "Next steps:"
echo "1. Verify $TARGET_DIR/.env"
echo "2. chmod +x scripts/deploy.sh scripts/server-bootstrap.sh"
echo "3. bash scripts/deploy.sh $BRANCH"
