from datetime import datetime, timezone

from services.extraction import extract_text, get_page_count
from services.chunking import chunk_text
from services.embeddings import embed
from services.vector_store import upsert_chunks, delete_by_doc_id, ensure_collection
from services.tenant_vector_store import (
    upsert_chunks_for_tenant,
    delete_by_doc_id_for_tenant,
    ensure_tenant_collection,
)
from models.schemas import DocumentStatus


async def ingest_document(
    doc_id: str,
    doc_name: str,
    knowledge_base: str,
    file_path: str,
    mime_type: str,
    db_session=None,
    tenant_id: str | None = None,
) -> None:
    """Full ingestion pipeline: extract → chunk → embed → upsert to Qdrant → update DB.

    When tenant_id is provided the document is stored in the tenant-isolated
    Qdrant collection (tenant_<tenant_id>) instead of the shared collection.
    """
    from db.postgres import DocumentRecord
    from sqlalchemy import select

    async def _set_status(status: DocumentStatus, page_count: int | None = None) -> None:
        result = await db_session.execute(select(DocumentRecord).where(DocumentRecord.id == doc_id))
        record = result.scalar_one_or_none()
        if record:
            record.status = status
            if page_count is not None:
                record.page_count = page_count
                record.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            await db_session.commit()

    try:
        pages = extract_text(file_path, mime_type)
        page_count = get_page_count(file_path, mime_type)
        chunks = chunk_text(pages)

        if not chunks:
            raise ValueError("No text could be extracted from the document.")

        texts = [c["text"] for c in chunks]
        vectors = embed(texts)

        if tenant_id:
            ensure_tenant_collection(tenant_id)
            delete_by_doc_id_for_tenant(tenant_id, doc_id)
            upsert_chunks_for_tenant(tenant_id, doc_id, doc_name, knowledge_base, chunks, vectors)
        else:
            ensure_collection()
            delete_by_doc_id(doc_id)
            upsert_chunks(doc_id, doc_name, knowledge_base, chunks, vectors)

        await _set_status(DocumentStatus.ready, page_count)

    except Exception as exc:
        await _set_status(DocumentStatus.failed)
        raise exc
