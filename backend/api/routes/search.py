import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db
from models.schemas import SearchRequest, AnswerResult, Source, Chunk
from services.embeddings import embed
from services.vector_store import search as qdrant_search
from services.llm import generate_answer

router = APIRouter()


@router.post("/search", response_model=AnswerResult)
async def search(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    t0 = time.time()

    query_vector = embed([req.query])[0]
    hits = qdrant_search(query_vector, top_k=5, knowledge_base=req.knowledge_base)

    if not hits:
        return AnswerResult(answer=None, blocked=False, sources=[], latency_ms=0)

    # Group chunks by document
    docs: dict[str, list] = {}
    for hit in hits:
        doc_id = hit.payload["doc_id"]
        docs.setdefault(doc_id, []).append(hit)

    context_chunks = [hit.payload["text"] for hit in hits]
    answer_text = await generate_answer(req.query, context_chunks)

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
            chunks=[
                Chunk(
                    chunk_id=str(h.id),
                    text=h.payload["text"],
                    page_number=h.payload.get("page_number"),
                    score=round(h.score, 3),
                )
                for h in doc_hits
            ],
        ))

    return AnswerResult(
        answer=answer_text,
        blocked=False,
        sources=sources,
        model_used="kimi",
        latency_ms=int((time.time() - t0) * 1000),
    )
