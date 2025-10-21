#!/usr/bin/env sh
set -eu

# Build script for Vercel. Runs install+build in packages/frontend when present.
if [ -f packages/frontend/package.json ]; then
  echo "Found packages/frontend/package.json, building frontend..."
  cd packages/frontend
  npm ci
  npm run build
  echo "--- BUILD DEBUG ---"
  pwd
  echo "--- ROOT LIST ---"
  ls -la ..
  echo "--- FRONTEND LIST ---"
  ls -la .
  echo "--- DIST LIST ---"
  ls -la dist || true
else
  echo "No packages/frontend/package.json found, attempting root build..."
  npm ci
  npm run build
  echo "--- BUILD DEBUG ---"
  pwd
  echo "--- ROOT LIST ---"
  ls -la .
  echo "--- DIST LIST ---"
  ls -la dist || true
fi
