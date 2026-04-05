import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.core import get_db, User, UserTask, UserSkill, UserRoadmap
from api.routes.auth import get_current_user
from models.schemas import (
    CompleteTaskRequest, CreateTaskRequest, UpdateTaskRequest,
    RoadmapGenerateRequest, RoadmapProgressRequest
)
from services.ai_service import generate_roadmap
from services.socket_manager import manager
from services.analytics import get_live_metrics

router = APIRouter()

def _get_today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")

def _task_to_dict(t: UserTask) -> dict:
    """Serialize a UserTask ORM object to the shape the frontend expects."""
    return {
        "id":          t.id,
        "title":       t.title or "",
        "category":    t.category or "study",
        "duration":    t.duration or "30 mins",
        "priority":    t.priority or "medium",
        "description": t.description or "",
        "completed":   bool(t.completed),
        "is_ai":       bool(t.is_ai),
        "planner_type": t.planner_type or "daily",
        "date":        t.date or _get_today_str(),
        "day_of_week": t.day_of_week or "",
    }

# ── DAILY PLANNER ─────────────────────────────────────────────────────────────

@router.get("/planner/today")
def get_today_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = _get_today_str()
    tasks = db.query(UserTask).filter(
        UserTask.user_id == current_user.id,
        UserTask.date == today,
        UserTask.planner_type == "daily"
    ).all()

    return {
        "date":        today,
        "tasks":       [_task_to_dict(t) for t in tasks],
        "motivation":  "Keep pushing for your career goals!",
        "focus_area":  "Daily Focus",
        "planner_type": "daily",
    }

# ── WEEKLY PLANNER ────────────────────────────────────────────────────────────

@router.get("/planner/week")
def get_week_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = _get_today_str()
    # Get all weekly tasks for this user (not tied to a single date)
    tasks = db.query(UserTask).filter(
        UserTask.user_id == current_user.id,
        UserTask.planner_type == "weekly"
    ).all()

    return {
        "date":        today,
        "tasks":       [_task_to_dict(t) for t in tasks],
        "motivation":  "Structure your week for maximum growth!",
        "focus_area":  "Weekly Objective",
        "planner_type": "weekly",
    }

# ── ADD TASK ──────────────────────────────────────────────────────────────────

@router.post("/planner/add")
def add_task(
    req: CreateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = UserTask(
        user_id      = current_user.id,
        title        = req.title,
        category     = req.category,
        duration     = req.duration,
        priority     = req.priority,
        description  = req.description,
        date         = req.date or _get_today_str(),
        planner_type = req.planner_type,
        day_of_week  = req.day_of_week,
        completed    = False,
        is_ai        = False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_dict(task)

# ── UPDATE TASK ───────────────────────────────────────────────────────────────

@router.put("/planner/{task_id}")
def update_task(
    task_id: int,
    req: UpdateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(UserTask).filter(
        UserTask.id == task_id,
        UserTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = req.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return _task_to_dict(task)

# ── COMPLETE TASK ─────────────────────────────────────────────────────────────

@router.post("/planner/complete")
def complete_task(
    req: CompleteTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(UserTask).filter(
        UserTask.id == req.task_id,
        UserTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.completed = req.completed
    db.commit()
    return {"ok": True, "task_id": task.id, "completed": task.completed}

# ── DELETE TASK ───────────────────────────────────────────────────────────────

@router.delete("/planner/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(UserTask).filter(
        UserTask.id == task_id,
        UserTask.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"ok": True, "deleted_id": task_id}

# ── ROADMAP ───────────────────────────────────────────────────────────────────

@router.post("/roadmap/generate")
async def generate_career_roadmap(
    req: RoadmapGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # ── Upsert by goal: never create duplicates for the same user+goal ──────────
    existing = db.query(UserRoadmap).filter(
        UserRoadmap.user_id == current_user.id,
        UserRoadmap.goal.ilike(req.goal.strip()),
    ).first()

    data = generate_roadmap(req.goal)
    phases = data.get("phases", [])
    estimated_duration = data.get("estimated_duration", "")

    if existing:
        # Refresh phases on existing record — no new row
        existing.steps_json = json.dumps(phases)
        db.commit()
        db.refresh(existing)
        return {
            "id":                 existing.id,
            "goal":               existing.goal,
            "phases":             phases,
            "estimated_duration": estimated_duration,
        }

    roadmap = UserRoadmap(
        user_id    = current_user.id,
        goal       = req.goal.strip(),
        steps_json = json.dumps(phases),
    )
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)
    return {
        "id":                 roadmap.id,
        "goal":               roadmap.goal,
        "phases":             phases,
        "estimated_duration": estimated_duration,
    }

@router.get("/roadmap/my")
def get_my_roadmaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmaps = db.query(UserRoadmap).filter(
        UserRoadmap.user_id == current_user.id
    ).order_by(UserRoadmap.id.desc()).all()
    return [
        {
            "id":    r.id,
            "goal":  r.goal,
            "phases": json.loads(r.steps_json or "[]"),
            "estimated_duration": "",
        }
        for r in roadmaps
    ]


@router.post("/roadmap/{roadmap_id}/progress")
def update_roadmap_progress(
    roadmap_id: int,
    req: RoadmapProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a phase's completed flag and persist it in the DB."""
    roadmap = db.query(UserRoadmap).filter(
        UserRoadmap.id == roadmap_id,
        UserRoadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    phases = json.loads(roadmap.steps_json or "[]")
    updated = False
    for phase in phases:
        if phase.get("id") == req.phase_id:
            phase["completed"] = req.completed
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Phase not found")

    roadmap.steps_json = json.dumps(phases)
    db.commit()
    return {"ok": True, "phase_id": req.phase_id, "completed": req.completed}


@router.delete("/roadmap/{roadmap_id}")
def delete_roadmap(
    roadmap_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roadmap = db.query(UserRoadmap).filter(
        UserRoadmap.id == roadmap_id,
        UserRoadmap.user_id == current_user.id
    ).first()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")
    db.delete(roadmap)
    db.commit()
    return {"ok": True}
