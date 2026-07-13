#!/usr/bin/env bash
# Registry-free verification of the PACKED artifacts. Run from repo root:
#   bash fixtures/tarball-consumer/verify.sh
set -euo pipefail
export npm_config_verify_deps_before_run=false

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/fixtures/tarball-consumer"

echo "==> build packages"
( cd "$ROOT" && pnpm build >/dev/null )

echo "==> pack tokens/motion/react into the fixture"
rm -f "$DEST"/*.tgz
for p in tokens motion react; do
  ( cd "$ROOT/packages/$p" && pnpm pack --pack-destination "$DEST" >/dev/null )
done

echo "==> install external runtime deps (react, react-dom, clsx, tailwind-merge)"
( cd "$DEST" && pnpm install --ignore-workspace >/dev/null 2>&1 )

echo "==> extract packed dist into node_modules/@scope/* (simulates a published install)"
mkdir -p "$DEST/node_modules/@scope"
for p in tokens motion react; do
  rm -rf "$DEST/node_modules/@scope/$p"
  mkdir -p "$DEST/node_modules/@scope/$p"
  tar -xzf "$DEST/scope-$p-0.0.0.tgz" -C "$DEST/node_modules/@scope/$p" --strip-components=1
done

echo "==> smoke"
( cd "$DEST" && node smoke.mjs )
