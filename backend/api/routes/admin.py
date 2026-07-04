from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from db.postgres import get_db, Message, Conversation
from db.tenants import schema_name
from models.schemas import AdminStatus, AdminMetrics, UserOut

router = APIRouter()

DATA_SOURCES = [
    {"name": "Onboarding Document Registry", "connected": True},
    {"name": "Golden Standard Template Store", "connected": True},
    {"name": "Validation Result Archive", "connected": True},
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
    
    # 1. Validation Activity: Count messages in conversations of this tenant
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
    
    # 4. Feedback metrics
    feedback_res = await db.execute(
        select(func.avg(Message.feedback))
        .join(Conversation)
        .where(Conversation.tenant_id == tenant_id, Message.role == "assistant", Message.feedback.is_not(None))
    )
    avg_feedback = feedback_res.scalar()
    
    # 5. No result queries
    no_res_count = await db.execute(
        select(func.count(Message.id))
        .join(Conversation)
        .where(Conversation.tenant_id == tenant_id, Message.is_no_result == True)
    )
    no_result_count = no_res_count.scalar() or 0
    
    return AdminMetrics(
        validation_activity=search_count,
        ai_usage_tokens=ai_usage,
        storage_bytes=storage_bytes,
        avg_satisfaction=round(avg_feedback, 2) if avg_feedback is not None else None,
        no_result_count=no_result_count
    )


@router.get("/admin/compliance-issues")
async def get_compliance_issues(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    # Find user messages that led to a "no result" answer
    # This requires looking at the next message in the conversation, or just logging it on the user message.
    # For now, let's just return messages where is_no_result is True.
    result = await db.execute(
        select(Message.content)
        .join(Conversation)
        .where(Conversation.tenant_id == tenant_id, Message.is_no_result == True)
        .limit(10)
    )
    return [row[0] for row in result.all()]


@router.get("/admin/users", response_model=list[UserOut])
async def list_users(request: Request):
    # In a real app, query the central user table. 
    # For now, return a mock user representing the current session
    return [
        UserOut(id="user_1", username="admin_user", roles=request.state.roles)
    ]
