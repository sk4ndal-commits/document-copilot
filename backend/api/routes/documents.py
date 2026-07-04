import os
import uuid
import mimetypes
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.postgres import get_db
from db.tenants import (
    get_tenant_documents,
    get_tenant_document,
    upsert_tenant_document,
    delete_tenant_document,
    schema_name
)
from sqlalchemy import select, text
from models.schemas import DocumentOut, DocumentStatus, UploadResponse, KnowledgeBase, BulkUpdateDocuments, ValidateOnboardingResponse, ValidationResult, ExtractedInfo
from services.ingestion import ingest_document
from services.vector_store import delete_by_doc_id
from services import validation as validation_service

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
router = APIRouter()


@router.get("/documents", response_model=list[DocumentOut])
async def list_documents(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    records = await get_tenant_documents(db, tenant_id)
    return [
        DocumentOut(
            id=r["id"],
            name=r["name"],
            version=r["version"],
            updated_at=r["updated_at"],
            status=r["status"],
            knowledge_base=r["knowledge_base"],
            page_count=r["page_count"],
            size_bytes=r["size_bytes"],
        )
        for r in records
    ]


@router.get("/documents/{doc_id}/status", response_model=DocumentOut)
async def get_document_status(doc_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    record = await get_tenant_document(db, tenant_id, doc_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentOut(
        id=record["id"],
        name=record["name"],
        version=record["version"],
        updated_at=record["updated_at"],
        status=record["status"],
        knowledge_base=record["knowledge_base"],
        page_count=record["page_count"],
        size_bytes=record["size_bytes"],
    )


@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    knowledge_base: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    tenant_id = request.state.tenant_id
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    doc_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(UPLOAD_DIR, f"{doc_id}{ext}")

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    doc_data = {
        "id": doc_id,
        "name": file.filename,
        "version": "v1",
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "status": DocumentStatus.processing,
        "knowledge_base": knowledge_base,
        "size_bytes": len(contents),
        "file_path": file_path,
        "page_count": None,
    }
    await upsert_tenant_document(db, tenant_id, doc_data)

    background_tasks.add_task(ingest_document, doc_id, file.filename, knowledge_base, file_path, mime_type, db, tenant_id)

    return UploadResponse(id=doc_id)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(doc_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    record = await get_tenant_document(db, tenant_id, doc_id)
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_by_doc_id(doc_id)

    if record.get("file_path") and os.path.exists(record["file_path"]):
        os.remove(record["file_path"])

    await delete_tenant_document(db, tenant_id, doc_id)


@router.patch("/documents/bulk", status_code=200)
async def bulk_update_documents(data: BulkUpdateDocuments, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    schema = schema_name(tenant_id)
    if not data.doc_ids:
        return {"updated": 0}

    # Since we don't have a helper for bulk update in tenants.py, we use text()
    query = text(f"UPDATE {schema}.documents SET knowledge_base = :kb WHERE id = ANY(:ids)")
    await db.execute(query, {"kb": data.knowledge_base, "ids": data.doc_ids})
    await db.commit()
    return {"updated": len(data.doc_ids)}


@router.get("/admin/categories", response_model=list[KnowledgeBase])
async def list_categories(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    schema = schema_name(tenant_id)
    result = await db.execute(text(f"SELECT * FROM {schema}.knowledge_bases ORDER BY name ASC"))
    rows = result.mappings().all()
    return [KnowledgeBase(**dict(r)) for r in rows]


@router.post("/admin/categories", response_model=KnowledgeBase)
async def create_category(data: KnowledgeBase, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    schema = schema_name(tenant_id)
    cat_id = data.id or str(uuid.uuid4())
    query = text(f"""
        INSERT INTO {schema}.knowledge_bases (id, name, color, icon)
        VALUES (:id, :name, :color, :icon)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            color = EXCLUDED.color,
            icon = EXCLUDED.icon
        RETURNING *
    """)
    result = await db.execute(query, {"id": cat_id, "name": data.name, "color": data.color, "icon": data.icon})
    row = result.mappings().first()
    await db.commit()
    return KnowledgeBase(**dict(row))


@router.post("/documents/validate-onboarding", response_model=ValidateOnboardingResponse)
async def validate_onboarding_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    tmp_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(UPLOAD_DIR, f"tmp_{tmp_id}{ext}")

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

    try:
        raw = await validation_service.validate_document(file_path, mime_type, doc_type)
        extracted = ExtractedInfo(
            vat_id=raw.get("extracted_info", {}).get("vat_id"),
            hrb_number=raw.get("extracted_info", {}).get("hrb_number"),
            signatories=raw.get("extracted_info", {}).get("signatories"),
            document_date=raw.get("extracted_info", {}).get("document_date"),
            company_name=raw.get("extracted_info", {}).get("company_name"),
        )
        result = ValidationResult(
            is_valid=raw.get("is_valid", False),
            errors=raw.get("errors", []),
            extracted_info=extracted,
        )
    except Exception as e:
        result = ValidationResult(
            is_valid=False,
            errors=[f"Validation failed: {str(e)}"],
            extracted_info=ExtractedInfo(),
        )
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return ValidateOnboardingResponse(
        doc_type=doc_type,
        filename=file.filename or "",
        result=result,
    )
