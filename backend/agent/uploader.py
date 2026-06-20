"""
Network drive agent — uploader.

Sends a local file to the Knowledge Copilot backend via HTTPS.
Designed to run on the customer's server alongside the watcher.
"""

import logging
import mimetypes
import os
from pathlib import Path
import httpx

logger = logging.getLogger(__name__)

MIME_FALLBACKS = {
    ".pdf":  "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".txt":  "text/plain",
}


def _mime(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    return MIME_FALLBACKS.get(ext) or mimetypes.guess_type(file_path)[0] or "application/octet-stream"


async def upload_file(
    file_path: str,
    api_url: str,
    api_key: str,
    tenant_id: str,
    knowledge_base: str = "Network Drive",
) -> dict:
    """
    Upload a single file to POST /api/documents/upload.
    Returns the JSON response (contains the new document id).
    """
    name = Path(file_path).name
    mime = _mime(file_path)

    async with httpx.AsyncClient(timeout=120) as client:
        with open(file_path, "rb") as fh:
            res = await client.post(
                f"{api_url}/api/documents/upload",
                files={"file": (name, fh, mime)},
                data={"knowledge_base": knowledge_base},
                headers={
                    "X-Agent-Key": api_key,
                    "X-Tenant-ID": tenant_id,
                },
            )
        res.raise_for_status()
        logger.info("Uploaded %s → %s", name, res.json())
        return res.json()
