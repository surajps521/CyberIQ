from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional
import os

from pymongo import MongoClient


@dataclass(frozen=True)
class EvidenceMetadata:
    evidence_id: str
    image_url_or_path: str
    uploaded_by: str
    upload_time: datetime
    latitude: float
    longitude: float
    sha256_image_hash: str
    status: str


class EvidenceRepository:
    def insert(self, *, meta: EvidenceMetadata) -> dict[str, Any]:
        raise NotImplementedError


class MongoEvidenceRepository(EvidenceRepository):
    def __init__(self, *, mongo_uri: Optional[str] = None, db_name: Optional[str] = None, collection_name: str = "evidence"):
        mongo_uri = mongo_uri or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
        db_name = db_name or os.getenv("MONGO_DB") or "crimeiq"

        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]

    def insert(self, *, meta: EvidenceMetadata) -> dict[str, Any]:
        doc = {
            "evidenceId": meta.evidence_id,
            "imageUrlOrPath": meta.image_url_or_path,
            "uploadedBy": meta.uploaded_by,
            "uploadTime": meta.upload_time.replace(tzinfo=timezone.utc),
            "latitude": meta.latitude,
            "longitude": meta.longitude,
            "sha256ImageHash": meta.sha256_image_hash,
            "status": meta.status,
        }
        res = self.collection.insert_one(doc)
        return {"insertedId": str(res.inserted_id), "evidence": doc}

