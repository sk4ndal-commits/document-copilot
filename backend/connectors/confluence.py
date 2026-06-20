import httpx
from connectors.base import BaseConnector


class ConfluenceConnector(BaseConnector):
    """
    Connects to Confluence Cloud or Server via REST API.
    Uses basic auth (email + API token for Cloud, username + password for Server).
    """

    def __init__(self, base_url: str, email: str, api_token: str, space_key: str):
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.api_token = api_token
        self.space_key = space_key

    def _auth(self) -> tuple:
        return (self.email, self.api_token)

    async def list_documents(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{self.base_url}/rest/api/content",
                params={"spaceKey": self.space_key, "type": "page", "limit": 250},
                auth=self._auth(),
            )
            res.raise_for_status()
            results = res.json().get("results", [])
            return [
                {
                    "id": page["id"],
                    "name": page["title"],
                    "mime_type": "text/html",
                    "modified_at": page.get("version", {}).get("when"),
                }
                for page in results
            ]

    async def download_document(self, doc_id: str) -> bytes:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{self.base_url}/rest/api/content/{doc_id}",
                params={"expand": "body.storage"},
                auth=self._auth(),
            )
            res.raise_for_status()
            body = res.json()["body"]["storage"]["value"]
            return body.encode("utf-8")

    async def get_delta(self, since_token: str | None = None) -> tuple[list[dict], str]:
        # Confluence doesn't have a native delta API — use last-modified filtering
        params: dict = {
            "spaceKey": self.space_key,
            "type": "page",
            "limit": 250,
            "orderby": "modified desc",
        }
        if since_token:
            params["start"] = since_token

        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{self.base_url}/rest/api/content",
                params=params,
                auth=self._auth(),
            )
            res.raise_for_status()
            data = res.json()

        results = data.get("results", [])
        next_start = str(data.get("start", 0) + len(results))

        changed = [
            {
                "id": page["id"],
                "name": page["title"],
                "mime_type": "text/html",
                "modified_at": page.get("version", {}).get("when"),
                "deleted": False,
            }
            for page in results
        ]
        return changed, next_start
