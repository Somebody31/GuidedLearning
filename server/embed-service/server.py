#!/usr/bin/env python3
"""
Local Qwen3 Embedding server (OpenAI-compatible /v1/embeddings).

Default model: Qwen/Qwen3-Embedding-0.6B (smallest official Qwen3 embedding;
there is no 0.8B in the series — sizes are 0.6B / 4B / 8B).
"""

from __future__ import annotations

import json
import os
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

MODEL_ID = os.environ.get("EMBED_MODEL", "Qwen/Qwen3-Embedding-0.6B")
HOST = os.environ.get("EMBED_HOST", "127.0.0.1")
PORT = int(os.environ.get("EMBED_PORT", "8790"))
# MRL: truncate/normalize to this dim (32–1024 for 0.6B). Default 1024 full.
EMBED_DIMS = int(os.environ.get("EMBED_DIMS", "1024"))
DEVICE = os.environ.get("EMBED_DEVICE", "auto")  # auto | cuda | cpu

_model = None


def get_device() -> str:
    if DEVICE != "auto":
        return DEVICE
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def load_model():
    global _model
    if _model is not None:
        return _model

    from sentence_transformers import SentenceTransformer

    device = get_device()
    print(f"[embed] loading {MODEL_ID} on {device} …", flush=True)
    _model = SentenceTransformer(MODEL_ID, device=device)
    # left padding recommended for Qwen3 embedding
    try:
        _model.tokenizer.padding_side = "left"
    except Exception:
        pass
    print(f"[embed] ready · dim_cap={EMBED_DIMS}", flush=True)
    return _model


def encode_texts(texts: list[str], *, is_query: bool) -> list[list[float]]:
    model = load_model()
    kwargs: dict = {
        "normalize_embeddings": True,
        "convert_to_numpy": True,
        "show_progress_bar": False,
    }
    # Official usage: queries use prompt_name="query"; documents do not.
    if is_query:
        kwargs["prompt_name"] = "query"

    # truncate long inputs for speed (docs allow 32k; we keep demos cheap)
    max_chars = int(os.environ.get("EMBED_MAX_CHARS", "4000"))
    clipped = [t if len(t) <= max_chars else t[:max_chars] for t in texts]

    vectors = model.encode(clipped, **kwargs)
    out: list[list[float]] = []
    for row in vectors:
        v = row.tolist()
        if EMBED_DIMS and len(v) > EMBED_DIMS:
            v = v[:EMBED_DIMS]
            # re-normalize after MRL truncate
            norm = sum(x * x for x in v) ** 0.5 or 1.0
            v = [x / norm for x in v]
        out.append(v)
    return out


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[embed] {self.address_string()} {fmt % args}", flush=True)

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path in ("/health", "/v1/health"):
            device = get_device()
            self._json(
                200,
                {
                    "ok": True,
                    "model": MODEL_ID,
                    "device": device,
                    "dims": EMBED_DIMS,
                    "loaded": _model is not None,
                },
            )
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return

        if path in ("/v1/embeddings", "/embeddings"):
            try:
                inp = body.get("input")
                if isinstance(inp, str):
                    texts = [inp]
                elif isinstance(inp, list):
                    texts = [str(x) for x in inp]
                else:
                    self._json(400, {"error": "input must be string or string[]"})
                    return
                if not texts:
                    self._json(400, {"error": "empty input"})
                    return
                if len(texts) > 64:
                    self._json(400, {"error": "max 64 texts per request"})
                    return

                # Optional: {"input_type": "query"|"document"} — default document
                input_type = str(body.get("input_type") or body.get("type") or "document")
                is_query = input_type.lower() in ("query", "q", "search")

                vectors = encode_texts(texts, is_query=is_query)
                data = [
                    {
                        "object": "embedding",
                        "index": i,
                        "embedding": vec,
                    }
                    for i, vec in enumerate(vectors)
                ]
                self._json(
                    200,
                    {
                        "object": "list",
                        "model": body.get("model") or MODEL_ID,
                        "data": data,
                        "usage": {
                            "prompt_tokens": sum(max(1, len(t) // 4) for t in texts),
                            "total_tokens": sum(max(1, len(t) // 4) for t in texts),
                        },
                    },
                )
            except Exception as e:
                traceback.print_exc()
                self._json(500, {"error": str(e)})
            return

        self._json(404, {"error": "not found"})


def main() -> None:
    # Eager load so first client request is fast
    load_model()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[embed] listening http://{HOST}:{PORT}  model={MODEL_ID}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
