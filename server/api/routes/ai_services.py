import io
import json
import os
import httpx
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, JSONResponse
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

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY") or os.getenv("NVIDIA_MLAT", "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")
NVIDIA_BASE_URL = os.getenv("NVIDIA_API_BASE_URL", "https://integrate.api.nvidia.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "meta/llama3-70b-instruct")

@router.get("/ping")
def ping_ai(): return {"status": "AI Router Active"}

@router.get("/models")
def list_available_models():
    """Diagnostic route to list all models available to the current NVIDIA_API_KEY."""
    if not NVIDIA_API_KEY:
        return {"error": "NVIDIA_API_KEY is missing"}
    
    try:
        from services.ai_service import _client
        models = _client.models.list()
        return {"available_models": [m.id for m in models.data]}
    except Exception as e:
        return {"error": str(e), "suggestion": "Check if API key is valid and has permission to list models."}


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
    system = (
        f"You are the Cognitive Code Oracle. Directly refine the provided {req.language} code.\n"
        "Strict Formatting:\n"
        "1. No preamble. No markdown code blocks (```).\n"
        "2. Provide refined code immediately.\n"
        "3. Delimiter: Provide '--- EXPLANATIONS ---' on a new line after the code.\n"
        "4. Annotations: Provide line-by-line notes after the delimiter using: '• Line X: Description'.\n"
        "Acknowledge this and begin response with the code."
    )

    models_to_try = [MODEL_NAME, "meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct"]
    
    async def stream():
        # Protocol Heartbeat: force cloud proxy buffer open with initial data
        yield "data: {\"choices\":[{\"delta\":{\"content\":\". \"}}]}\n\n"
        
        headers = {"Authorization": f"Bearer {NVIDIA_API_KEY}", "Content-Type": "application/json"}
        
        last_error = None
        for model in models_to_try:
            payload = {"model": model, "messages": [{"role": "system", "content": system}, {"role": "user", "content": req.code}], "stream": True}
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", f"{NVIDIA_BASE_URL}/chat/completions", json=payload, headers=headers) as r:
                        if r.status_code != 200:
                            err_body = await r.aread()
                            last_error = f"HTTP {r.status_code}: {err_body.decode()}"
                            print(f"⚠️ Oracle Fallback: {model} failed with {last_error}")
                            continue

                        async for line in r.aiter_lines():
                            if line.startswith("data:"):
                                yield f"{line}\n\n"
                        return # Success!
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ Oracle Fallback: {model} error: {last_error}")
                continue

        yield f"data: {json.dumps({'error': f'All AI models failed. Final error: {last_error}'})}\n\n"

    return StreamingResponse(
        stream(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Content-Type-Options": "nosniff"
        }
    )


# ── Communication Coach ───────────────────────────────────────────────────────

@router.post("/chat/analyze")
async def analyze_chat(
    req: ChatAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if not NVIDIA_API_KEY:
            raise ValueError("NVIDIA_API_KEY is missing in the production environment.")

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
        return _session_to_dict(session)
    except Exception as e:
        err_detail = str(e)
        print(f"❌ Coach Analysis Error: {err_detail}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Analysis failed: {err_detail}", "error": err_detail, "suggestion": "Ensure NVIDIA_API_KEY is valid and has model permissions."}
        )


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
    try:
        if not NVIDIA_API_KEY:
            raise ValueError("NVIDIA_API_KEY is missing in the production environment.")

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
    except Exception as e:
        err_detail = str(e)
        print(f"❌ Resume Analysis Error: {err_detail}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Resume analysis failed: {err_detail}", "error": err_detail, "suggestion": "Ensure NVIDIA_API_KEY is valid and has model permissions."}
        )



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

