from datetime import datetime, timezone
from fastapi import APIRouter
from models.schemas import AdminStatus

router = APIRouter()

DATA_SOURCES = [
    {"name": "SharePoint", "connected": True},
    {"name": "Network Drive", "connected": True},
    {"name": "Confluence", "connected": True},
]


@router.get("/admin/status", response_model=AdminStatus)
async def get_admin_status():
    return AdminStatus(
        data_sources=DATA_SOURCES,
        last_sync=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )
