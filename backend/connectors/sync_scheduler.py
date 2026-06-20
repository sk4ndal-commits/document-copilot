"""
Connector sync scheduler.

Runs every 5 minutes and syncs all enabled connectors for all tenants.
Uses APScheduler (AsyncIOScheduler) so it runs inside the FastAPI event loop.

Start/stop is wired into main.py lifespan.
"""

import logging
import tempfile
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from db.postgres import AsyncSessionLocal
from db.tenants import get_connector_configs, update_connector_delta_token
from connectors.registry import get_connector
from services.ingestion import ingest_document

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Populated at startup from the tenants table (or env for single-tenant dev)
_tenant_ids: list[str] = []


def register_tenant(tenant_id: str) -> None:
    """Register a tenant so the scheduler syncs its connectors."""
    if tenant_id not in _tenant_ids:
        _tenant_ids.append(tenant_id)


async def _sync_tenant(tenant_id: str) -> None:
    async with AsyncSessionLocal() as session:
        configs = await get_connector_configs(session, tenant_id)

    for cfg in configs:
        connector_type = cfg["connector_type"]
        config_id = cfg["id"]
        connector_config = cfg["config"]
        delta_token = cfg.get("last_delta_token")

        try:
            connector = get_connector(connector_type, connector_config)
            changed_docs, new_token = await connector.get_delta(delta_token)

            for doc_meta in changed_docs:
                if doc_meta.get("deleted"):
                    # TODO: delete from vector store + DB
                    logger.info("Connector %s: deleted %s", connector_type, doc_meta["name"])
                    continue

                # Download and ingest
                content = await connector.download_document(doc_meta["id"])
                with tempfile.NamedTemporaryFile(delete=False, suffix=_suffix(doc_meta["name"])) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name

                try:
                    await ingest_document(
                        doc_id=f"{tenant_id}_{doc_meta['id']}",
                        doc_name=doc_meta["name"],
                        file_path=tmp_path,
                        mime_type=doc_meta.get("mime_type", "application/octet-stream"),
                        knowledge_base=connector_config.get("knowledge_base", connector_type),
                        tenant_id=tenant_id,
                    )
                    logger.info("Connector %s: ingested %s", connector_type, doc_meta["name"])
                finally:
                    os.unlink(tmp_path)

            # Persist new delta token
            async with AsyncSessionLocal() as session:
                await update_connector_delta_token(session, tenant_id, config_id, new_token)

        except Exception:
            logger.exception("Connector sync failed for tenant=%s type=%s", tenant_id, connector_type)


def _suffix(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext or ".bin"


@scheduler.scheduled_job("interval", minutes=5, id="connector_sync")
async def sync_all_connectors() -> None:
    for tenant_id in list(_tenant_ids):
        await _sync_tenant(tenant_id)


def start_scheduler() -> None:
    if not scheduler.running:
        scheduler.start()
        logger.info("Connector sync scheduler started (interval: 5 min)")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Connector sync scheduler stopped")
