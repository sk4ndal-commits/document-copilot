import uuid
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from db.postgres import get_db, Conversation, Message
from models.schemas import ConversationOut, MessageOut, ChatHistoryRequest

router = APIRouter()


@router.get("/", response_model=list[ConversationOut])
async def get_conversations(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    # In a real app, we'd also filter by user_id from request.state.user_id
    
    result = await db.execute(
        select(Conversation)
        .where(Conversation.tenant_id == tenant_id)
        .order_by(desc(Conversation.created_at))
    )
    conversations = result.scalars().all()
    
    # Simple mapping for last_message (could be optimized with a join)
    out = []
    for conv in conversations:
        msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.timestamp))
            .limit(1)
        )
        last_msg = msg_result.scalar_one_or_none()
        out.append(ConversationOut(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            last_message=last_msg.content if last_msg else None
        ))
    return out


@router.get("/{conversation_id}", response_model=list[MessageOut])
async def get_messages(conversation_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    
    # Verify conversation belongs to tenant
    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.tenant_id == tenant_id)
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp)
    )
    return result.scalars().all()


@router.post("/", response_model=ConversationOut)
async def create_conversation(req: ChatHistoryRequest, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    # user_id = request.state.user_id # Extract from token in real implementation
    user_id = "default_user" 
    
    conv_id = req.conversation_id or str(uuid.uuid4())
    
    # If no conversation_id, create new conversation
    if not req.conversation_id:
        title = req.message[:50] + "..." if len(req.message) > 50 else req.message
        new_conv = Conversation(
            id=conv_id,
            tenant_id=tenant_id,
            user_id=user_id,
            title=title
        )
        db.add(new_conv)
        await db.flush()
    else:
        # Check if exists
        conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
        if not conv_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Conversation not found")

    # Add user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    
    await db.commit()
    
    # Re-fetch for response
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = conv_result.scalar_one()
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        last_message=req.message
    )
