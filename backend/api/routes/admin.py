from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from db.postgres import get_db, Message, Conversation
from db.tenants import schema_name
from models.schemas import AdminStatus, AdminMetrics, UserOut

router = APIRouter()

DATA_SOURCES = [
    {"name": "SharePoint", "connected": True},
    {"name": "Network Drive", "connected": True},
    {"name": "Confluence", "connected": True},
]


@router.get("/admin/status", response_model=AdminStatus)
async def get_admin_status():
    return AdminStatus(
        data_sources=DATA_SOURCES,
        last_sync=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )


@router.get("/admin/metrics", response_model=AdminMetrics)
async def get_metrics(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    
    # 1. Search Activity: Count messages in conversations of this tenant
    search_count_res = await db.execute(
        select(func.count(Message.id))
        .join(Conversation)
        .where(Conversation.tenant_id == tenant_id)
    )
    search_count = search_count_res.scalar() or 0
    
    # 2. AI Usage: Mocked for now, as we don't have a Usage table yet
    ai_usage = search_count * 150 # Assume average 150 tokens per search
    
    # 3. Storage: Sum file sizes from the tenant's document table
    schema = schema_name(tenant_id)
    storage_res = await db.execute(text(f"SELECT SUM(size_bytes) FROM {schema}.documents"))
    storage_bytes = storage_res.scalar() or 0
    
    return AdminMetrics(
        search_activity=search_count,
        ai_usage_tokens=ai_usage,
        storage_bytes=storage_bytes
    )


@router.get("/admin/users", response_model=list[UserOut])
async def list_users(request: Request):
    # In a real app, query the central user table. 
    # For now, return a mock user representing the current session
    return [
        UserOut(id="user_1", username="admin_user", roles=request.state.roles)
    ]
