from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Optional, Any

import jwt
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


class JWTAuth:
    def __init__(
        self,
        *,
        secret: Optional[str] = None,
        algorithm: str = "HS256",
        expire_seconds: int = 60 * 60 * 8,
        issuer: str = "crimeiq",
        audience: str = "crimeiq-client",
    ):
        self.secret = secret or os.getenv("JWT_SECRET") or "dev-change-me"
        self.algorithm = algorithm
        self.expire_seconds = expire_seconds
        self.issuer = issuer
        self.audience = audience

        self.bearer = HTTPBearer(auto_error=False)

    def create_token(self, *, user_id: str, uploaded_by: str, role: Optional[str] = None) -> str:
        now = int(time.time())
        payload: dict[str, Any] = {
            "sub": user_id,
            "uploadedBy": uploaded_by,
            "role": role,
            "iss": self.issuer,
            "aud": self.audience,
            "iat": now,
            "exp": now + int(self.expire_seconds),
        }
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def decode_credentials(self, credentials: HTTPAuthorizationCredentials) -> dict[str, Any]:
        if not credentials:
            raise HTTPException(status_code=401, detail="Missing Authorization header")

        if credentials.scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")

        try:
            token = credentials.credentials
            decoded = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer,
            )
            return decoded
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="JWT expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid JWT")

    async def require_user(self) -> dict[str, Any]:
        creds = self.bearer
        # actual dependency usage is handled by endpoints calling this
        return {}


jwt_auth = JWTAuth()

