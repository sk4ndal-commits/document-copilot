from services.extraction import extract_text
from services import llm


async def validate_document(file_path: str, mime_type: str, doc_type: str) -> dict:
    """Extract text from a document and validate it against legal requirements."""
    chunks = extract_text(file_path, mime_type)
    full_text = "\n\n".join(chunk["text"] for chunk in chunks if chunk.get("text"))
    result = await llm.validate_legal_document(full_text, doc_type)
    return result
