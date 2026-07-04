import os
import json
import httpx

KIMI_API_URL = os.getenv("KIMI_API_URL", "https://api.openai.com/v1/chat/completions")
KIMI_API_KEY = os.getenv("KIMI_API_KEY")

headers = {
    "Authorization": f"Bearer {KIMI_API_KEY}",
    "Content-Type": "application/json"
}


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
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(
            KIMI_API_URL,
            headers=headers,
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 1024,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def generate_follow_up(query: str, answer: str | None = None, context: str | None = None) -> list[str]:
    context_str = f"\nContext: {context}" if context else ""
    answer_str = f"\nAnswer: {answer}" if answer else ""
    prompt = (
        "Based on the original question and the information provided, suggest exactly 3 short follow-up questions "
        "that the user might want to ask next. Format as a simple list of questions, one per line.\n\n"
        f"Original Question: {query}"
        f"{context_str}"
        f"{answer_str}\n\n"
        "Follow-up Questions:"
    )
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(
                KIMI_API_URL,
                headers=headers,
                json={
                    "model": "gpt-4o",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.5,
                    "max_tokens": 256,
                },
            )
            res.raise_for_status()
            text = res.json()["choices"][0]["message"]["content"]
            questions = [q.strip(" 123.-") for q in text.strip().split("\n") if q.strip()]
            return questions[:3]
    except Exception:
        # Fallback to defaults if LLM fails or is slow
        return [
            "Can you explain that in more detail?",
            "What are the next steps?",
            "Where can I find more information?"
        ]


async def generate_summary(text: str) -> str:
    prompt = (
        "Summarize the following document content in 5 key bullet points. "
        "Be concise and capture the most important information.\n\n"
        f"Content:\n{text}\n\n"
        "Summary:"
    )
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(
            KIMI_API_URL,
            headers=headers,
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 512,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]


async def validate_legal_document(text: str, doc_type: str) -> dict:
    prompt = (
        "You are a German Legal Compliance Auditor.\n"
        f"Task: Validate the provided [{doc_type}] against the following criteria:\n"
        "1. Presence of a handwritten or qualified electronic signature.\n"
        "2. Document date must be within the last 90 days.\n"
        "3. Must include a valid German VAT ID (USt-IdNr) if applicable.\n"
        "4. Must include a valid HRB-Nummer (commercial register number) if applicable.\n"
        "5. Must include authorized signatories (Vertretungsberechtigte) if applicable.\n\n"
        f"Document Content:\n{text[:8000]}\n\n"
        "Respond ONLY with a valid JSON object in this exact format:\n"
        '{"is_valid": true/false, "errors": ["error1", "error2"], '
        '"extracted_info": {"vat_id": "...", "hrb_number": "...", '
        '"signatories": ["name1"], "document_date": "YYYY-MM-DD", "company_name": "..."}}\n'
        "Use null for fields that are not found. Do not include any text outside the JSON."
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(
            KIMI_API_URL,
            headers=headers,
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 1024,
            },
        )
        res.raise_for_status()
        raw = res.json()["choices"][0]["message"]["content"].strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())


async def compare_docs(doc_a_text: str, doc_b_text: str) -> str:
    prompt = (
        "Compare the following two documents. Highlight key similarities and differences "
        "in terms of content, dates, and obligations. Use bullet points.\n\n"
        f"Document A:\n{doc_a_text}\n\n"
        f"Document B:\n{doc_b_text}\n\n"
        "Comparison:"
    )
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(
            KIMI_API_URL,
            headers=headers,
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1024,
            },
        )
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"]
