import os
import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    PointStruct,
    VectorParams,
    Distance,
    Filter,
    FieldCondition,
    MatchValue,
)

COLLECTION = "documents"
VECTOR_SIZE = 1024  # bge-large-en-v1.5 output dimension

_client: QdrantClient | None = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        host = os.getenv("QDRANT_HOST", "localhost")
        port = int(os.getenv("QDRANT_PORT", "6333"))
        _client = QdrantClient(host=host, port=port)
    return _client


def ensure_collection() -> None:
    client = _get_client()
    existing = [c.name for c in client.get_collections().collections]
    if COLLECTION not in existing:
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )


def upsert_chunks(
    doc_id: str,
    doc_name: str,
    knowledge_base: str,
    chunks: list[dict],
    vectors: list[list[float]],
) -> None:
    client = _get_client()
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
            },
        )
        for chunk, vec in zip(chunks, vectors)
    ]
    client.upsert(collection_name=COLLECTION, points=points)


def delete_by_doc_id(doc_id: str) -> None:
    client = _get_client()
    client.delete(
        collection_name=COLLECTION,
        points_selector=Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
        ),
    )


def search(
    query_vector: list[float],
    top_k: int = 5,
    knowledge_base: str | None = None,
) -> list:
    client = _get_client()
    query_filter = None
    if knowledge_base:
        query_filter = Filter(
            must=[FieldCondition(key="knowledge_base", match=MatchValue(value=knowledge_base))]
        )
    result = client.query_points(
        collection_name=COLLECTION,
        query=query_vector,
        limit=top_k,
        query_filter=query_filter,
    )
    return result.points
