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
    delete_tenant_document
)
from models.schemas import DocumentOut, DocumentStatus, UploadResponse
from services.ingestion import ingest_document
from services.vector_store import delete_by_doc_id

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
