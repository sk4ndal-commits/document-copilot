import os
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
        _model = SentenceTransformer(model_name)
    return _model


def embed(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts. Returns normalized vectors."""
    model = _get_model()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()
