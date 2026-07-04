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
    """Search for specific legal clauses or obligations across compliance documents."""
    context = "\n\n---\n\n".join(context_chunks)
    prompt = (
        "You are a German Legal Compliance Assistant. "
        "The user is searching for specific legal clauses, obligations, or provisions within compliance documents. "
        "Answer the question based only on the provided document excerpts. "
        "Highlight relevant clauses, identify the document they originate from, and flag any inconsistencies or missing obligations. "
        "If the context does not contain the requested clause or information, state this clearly.\n\n"
        f"Compliance Document Excerpts:\n{context}\n\n"
        f"Legal Query: {query}\n\n"
        "Answer (cite document sources where possible):"
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
    """Suggest legal-context-aware follow-up queries for compliance clause searches."""
    context_str = f"\nDocument Context: {context}" if context else ""
    answer_str = f"\nFound Clauses: {answer}" if answer else ""
    prompt = (
        "You are a German Legal Compliance Assistant. "
        "Based on the original legal query and the compliance information found, suggest exactly 3 short follow-up questions "
        "that a compliance officer might want to investigate next. "
        "Focus on legal consistency, missing obligations, signature requirements, and regulatory compliance. "
        "Format as a simple list of questions, one per line.\n\n"
        f"Original Legal Query: {query}"
        f"{context_str}"
        f"{answer_str}\n\n"
        "Follow-up Compliance Questions:"
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
        # Fallback to legal-specific defaults if LLM fails or is slow
        return [
            "Are the VAT IDs consistent across all submitted documents?",
            "Which contracts are missing a valid signature?",
            "Are there any documents referencing an outdated HRB number?"
        ]


async def generate_summary(text: str) -> str:
    """Extract legal metadata and key compliance information from a document."""
    prompt = (
        "You are a German Legal Compliance Auditor. "
        "Extract and summarize the key legal metadata from the following document. "
        "Focus on: involved parties and their roles (Geschäftsführer, Prokurist, etc.), "
        "document date, signatures present, VAT ID (USt-IdNr), HRB number, "
        "contractual obligations, and any compliance risks or missing required elements. "
        "Present findings as concise bullet points.\n\n"
        f"Document Content:\n{text}\n\n"
        "Legal Metadata Summary:"
    )
    async with httpx.AsyncClient(timeout=45.0) as client:
        res = await client.post(
            KIMI_API_URL,
            headers=headers,
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
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
    """Compare an uploaded document against an approved company template (Golden Standard)."""
    prompt = (
        "You are a German Legal Compliance Auditor performing a Golden Standard comparison. "
        "Document A is the approved company template. Document B is the uploaded document to be reviewed. "
        "Identify all legal discrepancies, missing clauses, deviating obligations, and inconsistent party details "
        "(e.g., different VAT IDs, HRB numbers, signatory names, or representation types such as Prokura vs. Geschäftsführer). "
        "Flag any compliance risks introduced by the deviations. Use bullet points grouped by: "
        "Missing Clauses, Deviating Obligations, Inconsistent Party Details, Compliance Risks.\n\n"
        f"Document A (Golden Standard / Approved Template):\n{doc_a_text}\n\n"
        f"Document B (Uploaded Document for Review):\n{doc_b_text}\n\n"
        "Golden Standard Comparison:"
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
