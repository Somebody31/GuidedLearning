#!/usr/bin/env bash
# Start the local embedding server (Python).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

export EMBED_MODEL="${EMBED_MODEL:-Qwen/Qwen3-Embedding-0.6B}"
export EMBED_HOST="${EMBED_HOST:-127.0.0.1}"
export EMBED_PORT="${EMBED_PORT:-8790}"
export EMBED_DIMS="${EMBED_DIMS:-1024}"
# Use the GPU. Set EMBED_DEVICE=cpu if you do not have one.
export EMBED_DEVICE="${EMBED_DEVICE:-cuda}"

if [[ ! -x "$ROOT/.venv/bin/python" ]]; then
  echo "Missing venv. Run: uv venv --python python3.12 .venv && uv pip install -r requirements.txt"
  exit 1
fi

exec "$ROOT/.venv/bin/python" "$ROOT/server.py"
