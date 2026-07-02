from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db, DocumentRecord
from sqlalchemy import select
from models.schemas import SummaryResponse, ComparisonRequest, ComparisonResponse
from services.tenant_vector_store import get_document_full_text_for_tenant
from services.llm import generate_summary, compare_docs

router = APIRouter()


@router.post("/ai/summarize/{doc_id}", response_model=SummaryResponse)
async def summarize_document(doc_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    
    # 1. Verify document exists and belongs to tenant (implicit by tenant-isolated Qdrant)
    # But let's check Postgres for extra safety
    result = await db.execute(select(DocumentRecord).where(DocumentRecord.id == doc_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # 2. Get full text from Qdrant
    text = get_document_full_text_for_tenant(tenant_id, doc_id)
    if not text:
        raise HTTPException(status_code=400, detail="Document has no content")
    
    # 3. Generate summary
    summary = await generate_summary(text)
    return SummaryResponse(summary=summary)


@router.post("/ai/compare", response_model=ComparisonResponse)
async def compare_documents(req: ComparisonRequest, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    
    # 1. Get text for both documents
    text_a = get_document_full_text_for_tenant(tenant_id, req.doc_id_a)
    text_b = get_document_full_text_for_tenant(tenant_id, req.doc_id_b)
    
    if not text_a or not text_b:
        raise HTTPException(status_code=400, detail="One or both documents have no content")
    
    # 2. Generate comparison
    comparison = await compare_docs(text_a, text_b)
    return ComparisonResponse(comparison=comparison)
