#!/usr/bin/env python3
"""
Small local embedding server.

The main Bun API sends text here and gets vectors back.
Default model: Qwen/Qwen3-Embedding-0.6B
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
EMBED_DIMS = int(os.environ.get("EMBED_DIMS", "1024"))
# cuda | cpu | auto
DEVICE = os.environ.get("EMBED_DEVICE", "cuda")

_model = None


def get_device() -> str:
    if DEVICE != "auto":
        return DEVICE
    try:
        import torch

        if torch.cuda.is_available():
            return "cuda"
        return "cpu"
    except Exception:
        return "cpu"


def load_model():
    global _model
    if _model is not None:
        return _model

    from sentence_transformers import SentenceTransformer
    import torch

    device = get_device()
    if device.startswith("cuda") and not torch.cuda.is_available():
        raise RuntimeError(
            "EMBED_DEVICE=cuda but no GPU was found. "
            "Install a CUDA torch build or set EMBED_DEVICE=cpu."
        )

    print(f"[embed] loading {MODEL_ID} on {device} …", flush=True)
    _model = SentenceTransformer(MODEL_ID, device=device)
    try:
        _model.tokenizer.padding_side = "left"
    except Exception:
        pass

    extra = ""
    if torch.cuda.is_available():
        extra = f" · gpu={torch.cuda.get_device_name(0)}"
    print(f"[embed] ready · dim_cap={EMBED_DIMS}{extra}", flush=True)
    return _model


def encode_texts(texts: list[str], *, is_query: bool) -> list[list[float]]:
    model = load_model()
    kwargs: dict = {
        "normalize_embeddings": True,
        "convert_to_numpy": True,
        "show_progress_bar": False,
    }
    if is_query:
        kwargs["prompt_name"] = "query"

    max_chars = int(os.environ.get("EMBED_MAX_CHARS", "4000"))
    clipped = []
    for t in texts:
        if len(t) <= max_chars:
            clipped.append(t)
        else:
            clipped.append(t[:max_chars])

    vectors = model.encode(clipped, **kwargs)
    out: list[list[float]] = []
    for row in vectors:
        v = row.tolist()
        if EMBED_DIMS and len(v) > EMBED_DIMS:
            v = v[:EMBED_DIMS]
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
            self._json(
                200,
                {
                    "ok": True,
                    "model": MODEL_ID,
                    "device": get_device(),
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

        if path not in ("/v1/embeddings", "/embeddings"):
            self._json(404, {"error": "not found"})
            return

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

            input_type = str(body.get("input_type") or body.get("type") or "document")
            is_query = input_type.lower() in ("query", "q", "search")

            vectors = encode_texts(texts, is_query=is_query)
            data = []
            for i, vec in enumerate(vectors):
                data.append(
                    {
                        "object": "embedding",
                        "index": i,
                        "embedding": vec,
                    }
                )
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


def main() -> None:
    load_model()
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"[embed] listening http://{HOST}:{PORT}  model={MODEL_ID}", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
