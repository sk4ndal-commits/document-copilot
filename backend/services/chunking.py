def chunk_text(pages: list[dict], chunk_size: int = 512, overlap: int = 64) -> list[dict]:
    """Split pages into overlapping word-based chunks."""
    chunks = []
    for page in pages:
        words = page["text"].split()
        if not words:
            continue
        step = max(1, chunk_size - overlap)
        for i in range(0, len(words), step):
            chunk_words = words[i:i + chunk_size]
            if not chunk_words:
                continue
            chunks.append({
                "text": " ".join(chunk_words),
                "page_number": page.get("page_number"),
                "start_offset": page.get("start_offset"),
                "end_offset": page.get("end_offset"),
            })
    return chunks
