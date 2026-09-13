"""
Internal-only auth: apps/web calls ai-service server-to-server with a
shared secret header, never exposed to the browser. Per the spec's env
var AI_SERVICE_SECRET.
"""

import hmac

from fastapi import Header, HTTPException

from config import get_settings


def verify_internal_secret(x_internal_secret: str = Header(...)) -> None:
    settings = get_settings()
    if not hmac.compare_digest(x_internal_secret, settings.ai_service_secret):
        raise HTTPException(status_code=401, detail="Invalid internal secret")
