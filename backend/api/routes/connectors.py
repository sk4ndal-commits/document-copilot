"""
Connector management API.

Allows admins to add, list, enable/disable, and manually trigger
sync for connectors (SharePoint, Confluence, etc.).
"""

import uuid
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Any

from db.postgres import get_db
from db.tenants import get_connector_configs, schema_name
from connectors.registry import REGISTRY
from connectors.sync_scheduler import register_tenant, _sync_tenant
from sqlalchemy import text

router = APIRouter()


class ConnectorCreateRequest(BaseModel):
    connector_type: str
    config: dict[str, Any]
    knowledge_base: str = "General"


class ConnectorOut(BaseModel):
    id: str
    connector_type: str
    knowledge_base: str
    enabled: bool
    last_sync_at: str | None


@router.get("/connectors", response_model=list[ConnectorOut])
async def list_connectors(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    rows = await get_connector_configs(db, tenant_id)
    return [
        ConnectorOut(
            id=r["id"],
            connector_type=r["connector_type"],
            knowledge_base=r["config"].get("knowledge_base", "General"),
            enabled=r["enabled"],
            last_sync_at=str(r["last_sync_at"]) if r.get("last_sync_at") else None,
        )
        for r in rows
    ]


@router.post("/connectors", status_code=201)
async def create_connector(
    request: Request,
    body: ConnectorCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    tenant_id = request.state.tenant_id

    if body.connector_type not in REGISTRY:
        raise HTTPException(400, f"Unknown connector type: {body.connector_type!r}. Available: {list(REGISTRY)}")

    config_id = str(uuid.uuid4())
    config_payload = {**body.config, "knowledge_base": body.knowledge_base}
    schema = schema_name(tenant_id)

    await db.execute(
        text(f"""
            INSERT INTO {schema}.connector_configs (id, connector_type, config)
            VALUES (:id, :ct, :cfg::jsonb)
        """),
        {"id": config_id, "ct": body.connector_type, "cfg": __import__("json").dumps(config_payload)},
    )
    await db.commit()

    # Ensure scheduler knows about this tenant
    register_tenant(tenant_id)

    return {"id": config_id, "connector_type": body.connector_type}


@router.delete("/connectors/{config_id}", status_code=204)
async def delete_connector(config_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    schema = schema_name(tenant_id)
    await db.execute(
        text(f"DELETE FROM {schema}.connector_configs WHERE id = :id"),
        {"id": config_id},
    )
    await db.commit()


@router.post("/connectors/{config_id}/sync", status_code=202)
async def trigger_sync(config_id: str, request: Request):
    """Manually trigger a sync for the current tenant (all connectors)."""
    tenant_id = request.state.tenant_id
    # Run in background — fire and forget
    import asyncio
    asyncio.create_task(_sync_tenant(tenant_id))
    return {"status": "sync triggered", "tenant_id": tenant_id}
