#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
want="$(tr -d '\r\n ' < .node-version)"
test "$(node -p process.versions.node)" = "$want" || { echo "Use Node $want from .node-version" >&2; exit 1; }
npm ci --no-audit --no-fund
npx --no-install playwright install chromium
