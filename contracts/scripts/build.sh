#!/usr/bin/env bash
# Build ALFRED contracts via Stellar CLI (ALF-024)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export CARGO_TARGET_DIR="$ROOT/target"

CONTRACT="${1:-all}"

build_one() {
  local name="$1"
  echo "==> Building $name"
  stellar contract build --package "$name"
}

if [[ "$CONTRACT" == "all" ]]; then
  build_one alfred-did-registry
  build_one alfred-vc-vault
  build_one alfred-vc-vault-factory
else
  build_one "$CONTRACT"
fi

echo "Done. WASM under target/wasm32v1-none/release/"
