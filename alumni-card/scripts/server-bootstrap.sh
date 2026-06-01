#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: bash scripts/server-bootstrap.sh <github_repo_url> [branch]"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"
TARGET_DIR="${TARGET_DIR:-/home/ubuntu/apps/alumni-card}"

echo "Preparing target directory: $TARGET_DIR"
mkdir -p "$(dirname "$TARGET_DIR")"

if [ -d "$TARGET_DIR/.git" ]; then
  echo "Git repository already exists at $TARGET_DIR"
else
  rm -rf "$TARGET_DIR"
  git clone -b "$BRANCH" "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

echo "Repository ready at $TARGET_DIR"
echo "Next steps:"
echo "1. Create $TARGET_DIR/.env"
echo "2. chmod +x scripts/deploy.sh"
echo "3. bash scripts/deploy.sh $BRANCH"
