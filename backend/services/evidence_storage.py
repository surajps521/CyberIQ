from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass(frozen=True)
class EvidenceStoredFile:
    url_or_path: str


class EvidenceStorage:
    """Storage adapter interface.

    Business logic should depend on this interface only.
    Later adapters can switch to S3/Cloudinary without changing endpoints/repo.
    """

    def save_image_bytes(self, *, evidence_id: str, image_bytes: bytes, image_extension: str) -> EvidenceStoredFile:
        raise NotImplementedError


class LocalDiskEvidenceStorage(EvidenceStorage):
    def __init__(self, *, base_dir: Optional[str] = None, public_url_base: Optional[str] = None):
        project_root = Path(__file__).resolve().parents[2]
        default_dir = project_root / "evidence_storage"
        self.base_dir = Path(base_dir) if base_dir else default_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

        # If you later add static serving, you can use this.
        self.public_url_base = public_url_base

    def save_image_bytes(self, *, evidence_id: str, image_bytes: bytes, image_extension: str) -> EvidenceStoredFile:
        ext = image_extension.lstrip(".").lower() or "jpg"
        filename = f"{evidence_id}.{ext}"
        dest_path = self.base_dir / filename
        with open(dest_path, "wb") as f:
            f.write(image_bytes)

        if self.public_url_base:
            # Best-effort URL format; if you later host via CDN/static.
            return EvidenceStoredFile(url_or_path=f"{self.public_url_base.rstrip('/')}/{filename}")

        # Fallback to relative path.
        # Fallback to relative path.
        return EvidenceStoredFile(url_or_path=str(dest_path).replace("\\", "/"))


