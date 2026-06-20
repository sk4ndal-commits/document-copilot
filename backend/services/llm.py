import os
import httpx

KIMI_API_URL = os.getenv("KIMI_API_URL", "http://localhost:8001/v1/chat/completions")


async def generate_answer(query: str, context_chunks: list[str]) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    prompt = (
        "You are a company knowledge assistant. "
        "Answer the question based only on the provided context. "
        "If the context does not contain enough information, say so clearly.\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\n\n"
        "Answer:"
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            KIMI_API_URL,
            json={
                "model": "kimi",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 1024,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
