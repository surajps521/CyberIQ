from __future__ import annotations

import hashlib
from typing import Tuple
from uuid import uuid4


ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_PREFIXES = {"image/"}


def generate_evidence_id() -> str:
    return str(uuid4())


def sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()


def validate_image_meta(filename: str | None, content_type: str | None) -> Tuple[str, str]:
    """Return (normalized_extension, normalized_mime).

    Validation happens best-effort based on filename extension + content-type.
    """
    ext = ""
    if filename:
        lower = filename.lower()
        for candidate in ALLOWED_IMAGE_EXTENSIONS:
            if lower.endswith(candidate):
                ext = candidate.lstrip(".")
                break

    if not content_type or not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        raise ValueError("Only image uploads are allowed")

    # If we didn't find extension from name, fall back from mime
    mime = content_type.lower().strip()
    if not ext:
        if mime == "image/png":
            ext = "png"
        elif mime == "image/jpeg":
            ext = "jpg"
        elif mime == "image/webp":
            ext = "webp"

    if not ext:
        raise ValueError("Unsupported image format")

    return ext, mime

