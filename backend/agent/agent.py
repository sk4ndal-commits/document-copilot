"""
Network Drive Agent — entry point.

Run this on the customer's server (Windows or Linux) to watch a folder
and automatically upload new/changed documents to the Knowledge Copilot backend.

Usage:
    python agent.py --watch /mnt/company_docs --api-url https://your-platform.com \
                    --api-key YOUR_KEY --tenant-id acme --knowledge-base "Service Manuals"

Package as a standalone binary with PyInstaller:
    pyinstaller --onefile agent.py
"""

import argparse
import asyncio
import logging
import queue
import threading

from agent.watcher import start_watcher
from agent.uploader import upload_file

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Thread-safe queue: watcher thread → async upload loop
_upload_queue: queue.Queue = queue.Queue()


def _enqueue(file_path: str) -> None:
    _upload_queue.put(file_path)


async def _upload_loop(api_url: str, api_key: str, tenant_id: str, knowledge_base: str) -> None:
    """Drain the upload queue and upload each file."""
    while True:
        try:
            file_path = _upload_queue.get_nowait()
        except queue.Empty:
            await asyncio.sleep(1)
            continue

        try:
            await upload_file(
                file_path=file_path,
                api_url=api_url,
                api_key=api_key,
                tenant_id=tenant_id,
                knowledge_base=knowledge_base,
            )
        except Exception:
            logger.exception("Failed to upload %s — will not retry automatically", file_path)
        finally:
            _upload_queue.task_done()


def main() -> None:
    parser = argparse.ArgumentParser(description="Knowledge Copilot — Network Drive Agent")
    parser.add_argument("--watch",          required=True,  help="Folder path to watch")
    parser.add_argument("--api-url",        required=True,  help="Backend base URL (e.g. https://platform.example.com)")
    parser.add_argument("--api-key",        required=True,  help="Agent API key")
    parser.add_argument("--tenant-id",      required=True,  help="Tenant ID")
    parser.add_argument("--knowledge-base", default="Network Drive", help="Knowledge base name")
    args = parser.parse_args()

    observer = start_watcher(args.watch, _enqueue)

    try:
        asyncio.run(
            _upload_loop(
                api_url=args.api_url,
                api_key=args.api_key,
                tenant_id=args.tenant_id,
                knowledge_base=args.knowledge_base,
            )
        )
    except KeyboardInterrupt:
        logger.info("Shutting down agent...")
    finally:
        observer.stop()
        observer.join()


if __name__ == "__main__":
    main()
