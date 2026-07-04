import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from db.postgres import get_db, OnboardingSessionRecord, OnboardingSlotRecord

router = APIRouter()

DEFAULT_SLOTS = [
    {"slot_id": "handelsregister", "doc_type": "Handelsregisterauszug",
     "label": "Handelsregisterauszug", "required": True},
    {"slot_id": "dpa", "doc_type": "DPA/DSGVO",
     "label": "Data Processing Agreement (DPA/DSGVO)", "required": True},
    {"slot_id": "haftpflicht", "doc_type": "Haftpflichtversicherung",
     "label": "Haftpflichtversicherungsnachweis", "required": True},
    {"slot_id": "steuer", "doc_type": "Steuerbescheinigung",
     "label": "Steuerbescheinigung / USt-IdNr", "required": False},
]


def _slot_summary(slots):
    total = len(slots)
    ready = sum(1 for s in slots if s.status == "ready")
    errors = sum(1 for s in slots if s.status == "error")
    return {"total": total, "ready": ready, "errors": errors}


@router.post("/onboarding/sessions")
async def create_session(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    body = await request.json()
    client_name = body.get("client_name", "")

    session_id = str(uuid.uuid4())
    session = OnboardingSessionRecord(
        id=session_id,
        tenant_id=tenant_id,
        client_name=client_name,
    )
    db.add(session)

    for slot_def in DEFAULT_SLOTS:
        slot = OnboardingSlotRecord(
            id=str(uuid.uuid4()),
            session_id=session_id,
            **slot_def,
        )
        db.add(slot)

    await db.commit()
    return {"id": session_id, "client_name": client_name}


@router.get("/onboarding/sessions")
async def list_sessions(request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    result = await db.execute(
        select(OnboardingSessionRecord)
        .options(selectinload(OnboardingSessionRecord.slots))
        .where(OnboardingSessionRecord.tenant_id == tenant_id)
        .order_by(OnboardingSessionRecord.created_at.desc())
    )
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "client_name": s.client_name,
            "created_at": s.created_at.isoformat(),
            "slot_summary": _slot_summary(s.slots),
        }
        for s in sessions
    ]


@router.get("/onboarding/sessions/{session_id}")
async def get_session(session_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    tenant_id = request.state.tenant_id
    result = await db.execute(
        select(OnboardingSessionRecord)
        .options(selectinload(OnboardingSessionRecord.slots))
        .where(
            OnboardingSessionRecord.id == session_id,
            OnboardingSessionRecord.tenant_id == tenant_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "client_name": session.client_name,
        "created_at": session.created_at.isoformat(),
        "slots": [
            {
                "slot_id": slot.slot_id,
                "doc_type": slot.doc_type,
                "label": slot.label,
                "required": slot.required,
                "status": slot.status,
                "filename": slot.filename,
                "result": slot.validation_result,
            }
            for slot in session.slots
        ],
    }


@router.patch("/onboarding/sessions/{session_id}/slots/{slot_id}")
async def update_slot(
    session_id: str,
    slot_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    tenant_id = request.state.tenant_id
    body = await request.json()

    result = await db.execute(
        select(OnboardingSlotRecord)
        .join(OnboardingSessionRecord)
        .where(
            OnboardingSlotRecord.session_id == session_id,
            OnboardingSlotRecord.slot_id == slot_id,
            OnboardingSessionRecord.tenant_id == tenant_id,
        )
    )
    slot = result.scalar_one_or_none()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    slot.status = body.get("status", slot.status)
    slot.filename = body.get("filename", slot.filename)
    slot.validation_result = body.get("result", slot.validation_result)
    slot.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}
