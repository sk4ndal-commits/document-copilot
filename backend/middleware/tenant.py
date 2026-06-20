"""
Tenant middleware.

Extracts tenant_id from the JWT (Keycloak claim) or falls back to
the X-Tenant-ID header for service-to-service calls (e.g. the network drive agent).

Every request handler can then read:  request.state.tenant_id
"""

import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

# Routes that don't require a tenant context (health check, docs)
_PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}


def _decode_jwt_tenant(token: str) -> str | None:
    """
    Decode the JWT and extract the tenant_id claim.
    Uses python-jose when available; falls back to a simple base64 decode
    so the middleware works even without Keycloak in development.
    """
    try:
        from jose import jwt as jose_jwt
        secret = os.getenv("JWT_SECRET", "")
        algorithms = os.getenv("JWT_ALGORITHMS", "RS256").split(",")
        payload = jose_jwt.decode(token, secret, algorithms=algorithms, options={"verify_aud": False})
        return payload.get("tenant_id") or payload.get("tid")
    except Exception:
        # Dev fallback: decode payload segment without verification
        import base64, json
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            padded = parts[1] + "=" * (-len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            return payload.get("tenant_id") or payload.get("tid")
        except Exception:
            return None


class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _PUBLIC_PATHS:
            return await call_next(request)

        tenant_id: str | None = None

        # 1. Try JWT Bearer token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            tenant_id = _decode_jwt_tenant(token)

        # 2. Fallback: explicit header (for agent / service-to-service)
        if not tenant_id:
            tenant_id = request.headers.get("X-Tenant-ID")

        # 3. Dev convenience: single-tenant mode via env var
        if not tenant_id:
            tenant_id = os.getenv("DEFAULT_TENANT_ID")

        if not tenant_id:
            raise HTTPException(status_code=403, detail="No tenant context. Provide a valid Bearer token or X-Tenant-ID header.")

        request.state.tenant_id = tenant_id
        return await call_next(request)
