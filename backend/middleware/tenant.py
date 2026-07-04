"""
Tenant middleware.

Extracts tenant_id from the JWT (Keycloak claim) or falls back to
the X-Tenant-ID header for service-to-service calls (e.g. the network drive agent).

Every request handler can then read:  request.state.tenant_id
"""

import os
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from db.postgres import engine

# Routes that don't require a tenant context (health check, docs, auth)
_PUBLIC_PATHS = {"/health", "/docs", "/openapi.json", "/redoc", "/api/auth/login", "/api/auth/register"}
_PUBLIC_PREFIXES = ("/api/onboarding/public/",)

# Simple cache for verified tenants: {tenant_id: expiry_timestamp}
_VERIFIED_TENANTS_CACHE = {}
CACHE_TTL = 3600  # 1 hour

def _decode_jwt_payload(token: str) -> dict | None:
    """
    Decode the JWT and return the full payload.
    Uses python-jose when available; falls back to a simple base64 decode
    so the middleware works even without Keycloak in development.
    """
    try:
        from jose import jwt as jose_jwt
        secret = os.getenv("JWT_SECRET", "your-secret-key")
        algorithms = os.getenv("JWT_ALGORITHMS", "RS256,HS256").split(",")
        return jose_jwt.decode(token, secret, algorithms=algorithms, options={"verify_aud": False})
    except Exception:
        # Dev fallback: decode payload segment without verification
        import base64, json
        try:
            parts = token.split(".")
            if len(parts) != 3:
                return None
            padded = parts[1] + "=" * (-len(parts[1]) % 4)
            return json.loads(base64.urlsafe_b64decode(padded))
        except Exception:
            return None

async def _verify_schema_exists(tenant_id: str) -> bool:
    """Check if the tenant's PostgreSQL schema exists."""
    from db.tenants import schema_name
    schema = schema_name(tenant_id)
    
    # Check cache first
    now = time.time()
    if tenant_id in _VERIFIED_TENANTS_CACHE:
        if now < _VERIFIED_TENANTS_CACHE[tenant_id]:
            return True

    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT schema_name FROM information_schema.schemata WHERE schema_name = :s"),
                {"s": schema}
            )
            exists = result.first() is not None
            if exists:
                _VERIFIED_TENANTS_CACHE[tenant_id] = now + CACHE_TTL
            return exists
    except Exception as e:
        print(f"Error verifying schema for tenant {tenant_id}: {e}")
        return False

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in _PUBLIC_PATHS:
            return await call_next(request)
        if any(request.url.path.startswith(p) for p in _PUBLIC_PREFIXES):
            return await call_next(request)

        tenant_id: str | None = None
        roles: list[str] = []

        # 1. Try JWT Bearer token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            payload = _decode_jwt_payload(token)
            if payload:
                tenant_id = payload.get("tenant_id") or payload.get("tid")
                roles = payload.get("roles", [])

        # 2. Fallback: explicit header (for agent / service-to-service)
        if not tenant_id:
            tenant_id = request.headers.get("X-Tenant-ID")

        # 3. Dev convenience: single-tenant mode via env var
        if not tenant_id:
            tenant_id = os.getenv("DEFAULT_TENANT_ID")

        if not tenant_id:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={"detail": "No tenant context. Provide a valid Bearer token or X-Tenant-ID header."}
            )

        # 4. Schema Verification (Graceful Error Handling)
        if not await _verify_schema_exists(tenant_id):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=403,
                content={
                    "detail": f"Tenant '{tenant_id}' is not properly initialized. "
                              "If you just reset the database, please re-register your account."
                }
            )

        request.state.tenant_id = tenant_id
        request.state.roles = roles
        return await call_next(request)
