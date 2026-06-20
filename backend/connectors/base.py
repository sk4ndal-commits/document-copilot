from abc import ABC, abstractmethod


class BaseConnector(ABC):
    """
    Interface every connector must implement.
    A connector is responsible for listing, downloading, and tracking
    changes in an external document source (SharePoint, network drive, etc.).
    """

    @abstractmethod
    async def list_documents(self) -> list[dict]:
        """
        Return a list of document metadata dicts.
        Each dict must contain at least: id, name, mime_type.
        """
        ...

    @abstractmethod
    async def download_document(self, doc_id: str) -> bytes:
        """Download and return raw bytes for a single document."""
        ...

    @abstractmethod
    async def get_delta(self, since_token: str | None = None) -> tuple[list[dict], str]:
        """
        Return (changed_documents, new_delta_token).
        changed_documents is a list of metadata dicts (same shape as list_documents).
        new_delta_token is an opaque string to pass on the next call.
        """
        ...
