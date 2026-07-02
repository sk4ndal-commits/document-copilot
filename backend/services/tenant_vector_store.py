"""
Multi-tenant Qdrant wrapper.

Each tenant gets its own collection: tenant_<tenant_id>
This ensures complete vector index isolation — no cross-tenant leakage.
"""

import uuid
from qdrant_client.models import PointStruct, VectorParams, Distance, Filter, FieldCondition, MatchValue

from services.vector_store import _get_client, VECTOR_SIZE


def _collection(tenant_id: str) -> str:
    safe = "".join(c if c.isalnum() or c == "_" else "_" for c in tenant_id)
    return f"tenant_{safe}"


def ensure_tenant_collection(tenant_id: str) -> None:
    """Create Qdrant collection for tenant if it doesn't exist. Idempotent."""
    client = _get_client()
    name = _collection(tenant_id)
    existing = [c.name for c in client.get_collections().collections]
    if name not in existing:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def upsert_chunks_for_tenant(
    tenant_id: str,
    doc_id: str,
    doc_name: str,
    knowledge_base: str,
    chunks: list[dict],
    vectors: list[list[float]],
    required_role: str | None = None,
) -> None:
    client = _get_client()
    collection = _collection(tenant_id)
    ensure_tenant_collection(tenant_id)
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vec,
            payload={
                "doc_id": doc_id,
                "doc_name": doc_name,
                "knowledge_base": knowledge_base,
                "text": chunk["text"],
                "page_number": chunk.get("page_number"),
                "start_offset": chunk.get("start_offset"),
                "end_offset": chunk.get("end_offset"),
                "required_role": required_role,
            },
        )
        for chunk, vec in zip(chunks, vectors)
    ]
    client.upsert(collection_name=collection, points=points)


def delete_by_doc_id_for_tenant(tenant_id: str, doc_id: str) -> None:
    client = _get_client()
    collection = _collection(tenant_id)
    client.delete(
        collection_name=collection,
        points_selector=Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
        ),
    )


def search_for_tenant(
    tenant_id: str,
    query_vector: list[float],
    top_k: int = 5,
    knowledge_base: str | None = None,
) -> list:
    client = _get_client()
    collection = _collection(tenant_id)
    query_filter = None
    if knowledge_base:
        query_filter = Filter(
            must=[FieldCondition(key="knowledge_base", match=MatchValue(value=knowledge_base))]
        )
    return client.search(
        collection_name=collection,
        query_vector=query_vector,
        limit=top_k,
        query_filter=query_filter,
    )


def get_document_full_text_for_tenant(tenant_id: str, doc_id: str) -> str:
    """Retrieve all chunks for a document and join them.
    Used for summarization and comparison.
    """
    client = _get_client()
    collection = _collection(tenant_id)

    # Scroll through all points for this doc_id
    points, _ = client.scroll(
        collection_name=collection,
        scroll_filter=Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
        ),
        limit=1000,
        with_payload=True,
    )

    # Sort by page and offset if available
    points.sort(key=lambda p: (p.payload.get("page_number") or 0, p.payload.get("start_offset") or 0))

    return "\n".join(p.payload["text"] for p in points)
