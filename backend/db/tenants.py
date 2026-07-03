"""
Multi-tenant database helpers.

Each tenant gets its own PostgreSQL schema: tenant_<tenant_id>
Tables created per schema: documents, connector_configs

This ensures complete data isolation between tenants at the DB level.
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import engine


def schema_name(tenant_id: str) -> str:
    """Return the PostgreSQL schema name for a tenant."""
    # Sanitise: only allow alphanumeric + underscore to prevent SQL injection
    safe = "".join(c if c.isalnum() or c == "_" else "_" for c in tenant_id)
    return f"tenant_{safe}"


TENANT_DDL = """
CREATE TABLE IF NOT EXISTS {schema}.documents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL DEFAULT 'v1',
    updated_at  TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'processing',
    knowledge_base TEXT NOT NULL,
    page_count  INTEGER,
    size_bytes  INTEGER,
    file_path   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {schema}.connector_configs (
    id              TEXT PRIMARY KEY,
    connector_type  TEXT NOT NULL,
    config          JSONB NOT NULL DEFAULT '{{}}',
    last_delta_token TEXT,
    last_sync_at    TIMESTAMPTZ,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS {schema}.knowledge_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""


async def provision_tenant(tenant_id: str) -> None:
    """Create schema + tables for a new tenant. Idempotent."""
    schema = schema_name(tenant_id)
    async with engine.begin() as conn:
        await conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema}"))
        for statement in TENANT_DDL.format(schema=schema).strip().split(";"):
            stmt = statement.strip()
            if stmt:
                await conn.execute(text(stmt))


async def get_tenant_documents(session: AsyncSession, tenant_id: str) -> list[dict]:
    schema = schema_name(tenant_id)
    result = await session.execute(text(f"SELECT * FROM {schema}.documents ORDER BY created_at DESC"))
    rows = result.mappings().all()
    return [dict(r) for r in rows]


async def get_tenant_document(session: AsyncSession, tenant_id: str, doc_id: str) -> dict | None:
    schema = schema_name(tenant_id)
    result = await session.execute(
        text(f"SELECT * FROM {schema}.documents WHERE id = :id"),
        {"id": doc_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def upsert_tenant_document(session: AsyncSession, tenant_id: str, doc: dict) -> None:
    schema = schema_name(tenant_id)
    # Ensure all required bind parameters are present for the SQL query
    params = {
        "id": doc.get("id"),
        "name": doc.get("name"),
        "version": doc.get("version", "v1"),
        "updated_at": doc.get("updated_at"),
        "status": doc.get("status"),
        "knowledge_base": doc.get("knowledge_base"),
        "page_count": doc.get("page_count"),
        "size_bytes": doc.get("size_bytes"),
        "file_path": doc.get("file_path"),
    }
    await session.execute(
        text(f"""
            INSERT INTO {schema}.documents
                (id, name, version, updated_at, status, knowledge_base, page_count, size_bytes, file_path)
            VALUES
                (:id, :name, :version, :updated_at, :status, :knowledge_base, :page_count, :size_bytes, :file_path)
            ON CONFLICT (id) DO UPDATE SET
                name           = EXCLUDED.name,
                version        = EXCLUDED.version,
                updated_at     = EXCLUDED.updated_at,
                status         = EXCLUDED.status,
                knowledge_base = EXCLUDED.knowledge_base,
                page_count     = EXCLUDED.page_count,
                size_bytes     = EXCLUDED.size_bytes,
                file_path      = EXCLUDED.file_path
        """),
        params,
    )
    await session.commit()


async def delete_tenant_document(session: AsyncSession, tenant_id: str, doc_id: str) -> None:
    schema = schema_name(tenant_id)
    await session.execute(
        text(f"DELETE FROM {schema}.documents WHERE id = :id"),
        {"id": doc_id},
    )
    await session.commit()


async def get_connector_configs(session: AsyncSession, tenant_id: str, connector_type: str | None = None) -> list[dict]:
    schema = schema_name(tenant_id)
    if connector_type:
        result = await session.execute(
            text(f"SELECT * FROM {schema}.connector_configs WHERE connector_type = :ct AND enabled = TRUE"),
            {"ct": connector_type},
        )
    else:
        result = await session.execute(
            text(f"SELECT * FROM {schema}.connector_configs WHERE enabled = TRUE")
        )
    return [dict(r) for r in result.mappings().all()]


async def update_connector_delta_token(
    session: AsyncSession, tenant_id: str, config_id: str, delta_token: str
) -> None:
    schema = schema_name(tenant_id)
    await session.execute(
        text(f"""
            UPDATE {schema}.connector_configs
            SET last_delta_token = :token, last_sync_at = NOW()
            WHERE id = :id
        """),
        {"token": delta_token, "id": config_id},
    )
    await session.commit()
