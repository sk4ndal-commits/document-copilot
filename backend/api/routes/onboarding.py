import os
import uuid
import mimetypes
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from db.postgres import get_db, OnboardingSessionRecord, OnboardingSlotRecord, ValidationResultRecord
from services import validation as validation_service
from services import llm

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")

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
    share_token = str(uuid.uuid4())
    session = OnboardingSessionRecord(
        id=session_id,
        tenant_id=tenant_id,
        client_name=client_name,
        share_token=share_token,
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
    return {"id": session_id, "client_name": client_name, "share_token": share_token}


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
        "share_token": session.share_token,
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


# ─── PUBLIC: GET session checklist by share_token (no JWT required) ───────────
@router.get("/onboarding/public/{share_token}")
async def get_public_session(share_token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(OnboardingSessionRecord)
        .options(selectinload(OnboardingSessionRecord.slots))
        .where(OnboardingSessionRecord.share_token == share_token)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "client_name": session.client_name,
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


# ─── PUBLIC: Upload + validate a document into a slot (no JWT required) ───────
@router.post("/onboarding/public/{share_token}/upload")
async def public_upload_slot(
    share_token: str,
    slot_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OnboardingSessionRecord)
        .options(selectinload(OnboardingSessionRecord.slots))
        .where(OnboardingSessionRecord.share_token == share_token)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    slot = next((s for s in session.slots if s.slot_id == slot_id), None)
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    tmp_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(UPLOAD_DIR, f"tmp_{tmp_id}{ext}")
    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    mime_type = (
        file.content_type
        or mimetypes.guess_type(file.filename or "")[0]
        or "application/octet-stream"
    )

    try:
        raw = await validation_service.validate_document(file_path, mime_type, slot.doc_type)
        is_valid = raw.get("is_valid", False)
        validation_result = {
            "is_valid": is_valid,
            "errors": raw.get("errors", []),
            "extracted_info": raw.get("extracted_info", {}),
        }
        slot.status = "ready" if is_valid else "error"
    except Exception as e:
        validation_result = {"is_valid": False, "errors": [str(e)], "extracted_info": {}}
        slot.status = "error"
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    slot.filename = file.filename
    slot.validation_result = validation_result
    slot.updated_at = datetime.now(timezone.utc)

    # ── Persist audit trail ──────────────────────────────────────────────────
    vr = ValidationResultRecord(
        id=str(uuid.uuid4()),
        session_id=session.id,
        tenant_id=session.tenant_id,
        doc_type=slot.doc_type,
        filename=file.filename,
        is_valid=validation_result["is_valid"],
        missing_fields=validation_result.get("errors", []),
        extracted_info=validation_result.get("extracted_info", {}),
        compliance_notes=None,
    )
    db.add(vr)
    await db.commit()

    return {
        "slot_id": slot_id,
        "status": slot.status,
        "filename": slot.filename,
        "result": validation_result,
    }


@router.post("/onboarding/sessions/{session_id}/cross-check")
async def cross_check_session(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
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

    ready_slots = [
        s for s in session.slots
        if s.status == "ready" and s.validation_result and s.validation_result.get("extracted_info")
    ]

    if len(ready_slots) < 2:
        raise HTTPException(
            status_code=422,
            detail="At least 2 validated slots are required for a cross-check."
        )

    extracted_infos = [
        {"doc_type": s.doc_type, **s.validation_result["extracted_info"]}
        for s in ready_slots
    ]

    report = await llm.cross_check_consistency(extracted_infos)
    return report
