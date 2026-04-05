import io
import json
import os
import httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database.core import get_db, User, UserSkill, UserProgress, CoachSession, ResumeAnalysis
from api.routes.auth import get_current_user
from models.schemas import ChatAnalyzeRequest
from services.ai_service import (
    analyze_communication, analyze_resume, extract_text_from_image
)
from services.socket_manager import manager
from services.analytics import get_live_metrics

router = APIRouter()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
NVIDIA_BASE_URL = os.getenv("BASE_URL", "https://integrate.api.nvidia.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "meta/llama-3.1-8b-instruct")


def _session_to_dict(s: CoachSession) -> dict:
    """Serialize CoachSession to the shape the frontend expects."""
    try:
        result = json.loads(s.result_json) if s.result_json else {}
    except Exception:
        result = {}
    return {
        "id":         s.id,
        "content":    s.content,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "result":     result,
    }


# ── Code Oracle ───────────────────────────────────────────────────────────────

class CodeRefineRequest(BaseModel):
    code: str
    language: str = "Code"

@router.post("/oracle/refine")
async def refine_code(req: CodeRefineRequest, current_user=Depends(get_current_user)):
    if not NVIDIA_API_KEY: raise HTTPException(status_code=503, detail="NVIDIA_API_KEY missing")
    system = f"Refine this {req.language} code."
    payload = {"model": MODEL_NAME, "messages": [{"role": "system", "content": system}, {"role": "user", "content": req.code}], "stream": True}
    headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}

    async def stream():
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", f"{NVIDIA_BASE_URL}/chat/completions", json=payload, headers=headers) as r:
                async for line in r.aiter_lines():
                    if line.startswith("data: "): yield f"{line}\n\n"
    return StreamingResponse(stream(), media_type="text/event-stream")


# ── Communication Coach ───────────────────────────────────────────────────────

@router.post("/chat/analyze")
async def analyze_chat(
    req: ChatAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = analyze_communication(req.message)
    session = CoachSession(
        user_id=current_user.id,
        content=req.message,
        result_json=json.dumps(result)
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    await manager.broadcast_to_user(current_user.id, get_live_metrics(current_user.id, db))
    # Return full session shape so frontend history list updates immediately
    return _session_to_dict(session)


@router.get("/chat/history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(CoachSession)
        .filter(CoachSession.user_id == current_user.id)
        .order_by(CoachSession.created_at.desc())
        .limit(50)
        .all()
    )
    return [_session_to_dict(s) for s in sessions]


@router.delete("/chat/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(CoachSession).filter(
        CoachSession.id == session_id,
        CoachSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"ok": True, "deleted_id": session_id}


# ── Resume ────────────────────────────────────────────────────────────────────

@router.post("/resume/analyze")
async def analyze_resume_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from services.ai_service import _normalize_resume_result

    # ── Upsert: same filename → update existing record, no duplicate ─────────────
    existing = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == current_user.id,
        ResumeAnalysis.filename == file.filename,
    ).first()

    contents = await file.read()
    text   = extract_text_from_image(contents, filename=file.filename)
    result = analyze_resume(text)

    if existing:
        existing.result_json = json.dumps(result)
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = ResumeAnalysis(
            user_id=current_user.id,
            filename=file.filename,
            result_json=json.dumps(result)
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    await manager.broadcast_to_user(current_user.id, get_live_metrics(current_user.id, db))
    return {
        "id":         record.id,
        "filename":   record.filename,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "result":     _normalize_resume_result(result),
        **result,
    }



@router.get("/resume/history")
def get_resume_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from services.ai_service import _normalize_resume_result
    records = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == current_user.id)
        .order_by(ResumeAnalysis.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id":         r.id,
            "filename":   r.filename,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "result":     _normalize_resume_result(json.loads(r.result_json or "{}")),
        }
        for r in records
    ]



@router.delete("/resume/{record_id}")
def delete_resume_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.id == record_id,
        ResumeAnalysis.user_id == current_user.id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"ok": True, "deleted_id": record_id}

