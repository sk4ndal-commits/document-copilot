import httpx
from connectors.base import BaseConnector

GRAPH_BASE = "https://graph.microsoft.com/v1.0"
TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"


class SharePointConnector(BaseConnector):
    """
    Connects to SharePoint Online via Microsoft Graph API.
    Uses client-credentials OAuth2 flow (app-only, no user interaction).
    """

    def __init__(self, tenant_id: str, client_id: str, client_secret: str, site_id: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.site_id = site_id
        self._token: str | None = None

    async def _get_token(self) -> str:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                TOKEN_URL.format(tenant_id=self.tenant_id),
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "scope": "https://graph.microsoft.com/.default",
                },
            )
            res.raise_for_status()
            self._token = res.json()["access_token"]
            return self._token

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    async def list_documents(self) -> list[dict]:
        await self._get_token()
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{GRAPH_BASE}/sites/{self.site_id}/drive/root/children",
                headers=self._headers(),
            )
            res.raise_for_status()
            items = res.json().get("value", [])
            return [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "mime_type": item.get("file", {}).get("mimeType", "application/octet-stream"),
                    "size_bytes": item.get("size"),
                    "modified_at": item.get("lastModifiedDateTime"),
                }
                for item in items
                if "file" in item  # skip folders
            ]

    async def download_document(self, doc_id: str) -> bytes:
        await self._get_token()
        async with httpx.AsyncClient() as client:
            # Get download URL
            meta_res = await client.get(
                f"{GRAPH_BASE}/sites/{self.site_id}/drive/items/{doc_id}",
                headers=self._headers(),
            )
            meta_res.raise_for_status()
            download_url = meta_res.json()["@microsoft.graph.downloadUrl"]

            # Download content (no auth header needed for pre-signed URL)
            content_res = await client.get(download_url)
            content_res.raise_for_status()
            return content_res.content

    async def get_delta(self, since_token: str | None = None) -> tuple[list[dict], str]:
        await self._get_token()
        url = f"{GRAPH_BASE}/sites/{self.site_id}/drive/root/delta"
        if since_token:
            url += f"?$deltatoken={since_token}"

        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=self._headers())
            res.raise_for_status()
            data = res.json()

        items = data.get("value", [])
        # Extract delta token from @odata.deltaLink
        delta_link = data.get("@odata.deltaLink", "")
        new_token = delta_link.split("$deltatoken=")[-1] if "$deltatoken=" in delta_link else ""

        changed = [
            {
                "id": item["id"],
                "name": item["name"],
                "mime_type": item.get("file", {}).get("mimeType", "application/octet-stream"),
                "size_bytes": item.get("size"),
                "modified_at": item.get("lastModifiedDateTime"),
                "deleted": "deleted" in item,
            }
            for item in items
            if "file" in item or "deleted" in item
        ]
        return changed, new_token
