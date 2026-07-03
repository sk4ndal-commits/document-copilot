import time
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.postgres import get_db, Message, Conversation
from models.schemas import SearchRequest, AnswerResult, Source, Chunk, FeedbackRequest
import uuid
from services.embeddings import embed
from services.tenant_vector_store import search_for_tenant
from services.llm import generate_answer, generate_follow_up

router = APIRouter()


@router.post("/search", response_model=AnswerResult)
async def search(req: SearchRequest, request: Request, db: AsyncSession = Depends(get_db)):
    t0 = time.time()
    tenant_id = request.state.tenant_id
    user_roles = request.state.roles

    query_vector = embed([req.query])[0]
    hits = search_for_tenant(tenant_id, query_vector, top_k=5, knowledge_base=req.knowledge_base)

    if not hits:
        return AnswerResult(answer=None, blocked=False, sources=[], latency_ms=0)

    # Filter hits by user permissions
    authorized_hits = [
        hit for hit in hits
        if not hit.payload.get("required_role") or hit.payload.get("required_role") in user_roles
    ]

    if not authorized_hits:
        return AnswerResult(answer="I found some results but you don't have permission to see them.", blocked=True, sources=[], latency_ms=int((time.time() - t0) * 1000))

    # Group chunks by document
    docs: dict[str, list] = {}
    for hit in authorized_hits:
        doc_id = hit.payload["doc_id"]
        docs.setdefault(doc_id, []).append(hit)

    context_chunks = [hit.payload["text"] for hit in authorized_hits]
    answer_text = await generate_answer(req.query, context_chunks)
    
    # Generate follow-up questions
    follow_ups = await generate_follow_up(req.query, answer_text)

    # Log search quality
    is_no_result = "I don't know" in answer_text or "I'm sorry" in answer_text
    # In a real app we would have a conversation_id in SearchRequest. 
    # For now, let's create a dummy conversation or just log the message if we had a way.
    # Since we don't have conversation_id here, we'll skip DB logging for now or add it later.

    sources = []
    for doc_id, doc_hits in docs.items():
        top_hit = doc_hits[0]
        score = top_hit.score
        confidence = "High" if score > 0.85 else "Medium" if score > 0.70 else "Low"
        sources.append(Source(
            id=doc_id,
            name=top_hit.payload["doc_name"],
            excerpt=top_hit.payload["text"][:300],
            confidence=confidence,
            score=round(score, 3),
            page_number=top_hit.payload.get("page_number"),
            start_offset=top_hit.payload.get("start_offset"),
            end_offset=top_hit.payload.get("end_offset"),
            chunks=[
                Chunk(
                    chunk_id=str(h.id),
                    text=h.payload["text"],
                    page_number=h.payload.get("page_number"),
                    start_offset=h.payload.get("start_offset"),
                    end_offset=h.payload.get("end_offset"),
                    score=round(h.score, 3),
                )
                for h in doc_hits
            ],
        ))

    return AnswerResult(
        answer=answer_text,
        blocked=False,
        sources=sources,
        follow_up_questions=follow_ups,
        model_used="gpt-4o",
        latency_ms=int((time.time() - t0) * 1000),
        id=str(uuid.uuid4())
    )


@router.post("/search/feedback")
async def search_feedback(req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Message).where(Message.id == req.message_id))
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    
    msg.feedback = req.feedback
    await db.commit()
    return {"status": "ok"}
