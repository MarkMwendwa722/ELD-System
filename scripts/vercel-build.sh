#!/usr/bin/env sh
set -eu

# Build script for Vercel. Runs install+build in packages/frontend when present.
if [ -f packages/frontend/package.json ]; then
  echo "Found packages/frontend/package.json, building frontend..."
  cd packages/frontend
  npm run build
  echo "--- BUILD DEBUG ---"
  pwd
  echo "--- ROOT LIST ---"
  ls -la ..
  echo "--- FRONTEND LIST ---"
  ls -la .
  echo "--- DIST LIST ---"
  ls -la dist || true
  # create a small marker so build logs / artifact show the dist was produced
  echo "ok" > dist/VERCEL_OK || true
else
  echo "No packages/frontend/package.json found, attempting root build..."
  npm run build
  echo "--- BUILD DEBUG ---"
  pwd
  echo "--- ROOT LIST ---"
  ls -la .
  echo "--- DIST LIST ---"
  ls -la dist || true
  echo "ok" > dist/VERCEL_OK || true
fi
