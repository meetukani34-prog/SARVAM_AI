"""
analytics.py — Real data aggregator for the SARVAM Dashboard.
Pulls from: ResumeAnalysis, CoachSession, UserTask (Planner), UserRoadmap.
"""
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database.core import User, UserTask, UserRoadmap, ResumeAnalysis, CoachSession


def _safe_json(text: str, default=None):
    try:
        return json.loads(text or "[]") if text else (default or {})
    except Exception:
        return default or {}


def get_live_metrics(user_id: int, db: Session) -> dict:
    # ── Resume ────────────────────────────────────────────────────────────────
    resume_records = (
        db.query(ResumeAnalysis)
        .filter(ResumeAnalysis.user_id == user_id)
        .order_by(ResumeAnalysis.created_at.desc())
        .all()
    )
    resume_score = 0
    resume_skills = []
    resume_categories = {}
    if resume_records:
        latest = _safe_json(resume_records[0].result_json, {})
        raw = latest.get("overall_score", 0)
        # normalize to 0-100
        try:
            v = float(raw)
            resume_score = int(round(v * 10 if v <= 10 else v))
        except:
            resume_score = 0
        resume_skills = latest.get("skills", []) or []
        resume_categories = latest.get("skill_categories", {}) or {}

    # ── Coach (Communication) ─────────────────────────────────────────────────
    coach_sessions = (
        db.query(CoachSession)
        .filter(CoachSession.user_id == user_id)
        .order_by(CoachSession.created_at.desc())
        .limit(20)
        .all()
    )
    coach_scores = []
    for s in coach_sessions:
        r = _safe_json(s.result_json, {})
        cs = r.get("confidence_score", 0)
        try:
            v = float(cs)
            coach_scores.append(int(round(v * 100 if v <= 1 else v)))
        except:
            pass
    comm_score = int(round(sum(coach_scores) / len(coach_scores))) if coach_scores else 0

    # ── Planner ───────────────────────────────────────────────────────────────
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    today_tasks    = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.date == today_str).all()
    tasks_done     = sum(1 for t in today_tasks if t.completed)
    total_tasks    = len(today_tasks)
    occupancy      = round(tasks_done / total_tasks * 100) if total_tasks > 0 else 0

    all_tasks = db.query(UserTask).filter(UserTask.user_id == user_id).all()
    total_all  = len(all_tasks)
    done_all   = sum(1 for t in all_tasks if t.completed)
    planner_score = round(done_all / total_all * 100) if total_all > 0 else 0

    # ── Roadmap ───────────────────────────────────────────────────────────────
    roadmaps = db.query(UserRoadmap).filter(UserRoadmap.user_id == user_id).all()
    roadmap_score = 0
    roadmap_progress = []
    if roadmaps:
        scores = []
        for rm in roadmaps:
            phases = _safe_json(rm.steps_json, [])
            if not phases:
                phases = _safe_json(rm.progress_json, [])
            total_ph = len(phases)
            done_ph  = sum(1 for p in phases if p.get("completed", False))
            if total_ph > 0:
                scores.append(done_ph / total_ph * 100)
            roadmap_progress.append({
                "goal":     rm.goal,
                "total":    total_ph,
                "done":     done_ph,
                "pct":      round(done_ph / total_ph * 100) if total_ph else 0,
            })
        roadmap_score = int(round(sum(scores) / len(scores))) if scores else 0

    # ── Overall (weighted avg of all 4) ──────────────────────────────────────
    weights = [(resume_score, 0.35), (comm_score, 0.25), (planner_score, 0.20), (roadmap_score, 0.20)]
    overall_score = round(sum(s * w for s, w in weights))

    # ── Streak (days with any planner activity) ───────────────────────────────
    streak, now = 0, datetime.utcnow()
    for i in range(30):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.date == d).first():
            streak += 1
        else:
            break

    # ── Weekly chart: last 7 days real data ───────────────────────────────────
    weekly_data = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_lbl = day.strftime("%a")
        day_tasks = db.query(UserTask).filter(UserTask.user_id == user_id, UserTask.date == day_str).all()
        day_done  = sum(1 for t in day_tasks if t.completed)
        day_total = len(day_tasks)
        day_plan  = round(day_done / day_total * 100) if day_total else 0

        # Coach sessions that day
        day_coach = [
            s for s in coach_sessions
            if s.created_at and s.created_at.strftime("%Y-%m-%d") == day_str
        ]
        day_comm = 0
        if day_coach:
            dc_scores = []
            for sc in day_coach:
                r = _safe_json(sc.result_json, {})
                v = r.get("confidence_score", 0)
                try:
                    fv = float(v)
                    dc_scores.append(int(round(fv * 100 if fv <= 1 else fv)))
                except:
                    pass
            day_comm = round(sum(dc_scores) / len(dc_scores)) if dc_scores else 0

        weekly_data.append({
            "day":           day_lbl,
            "Overall":       overall_score if i == 0 else day_plan,
            "Communication": day_comm,
            "Planner":       day_plan,
            "Resume":        resume_score if i == 0 else 0,
        })

    # ── Module score cards ────────────────────────────────────────────────────
    module_scores = [
        {"name": "📄 Resume",      "score": resume_score,  "color": "#8b5cf6"},
        {"name": "💬 Coach",       "score": comm_score,    "color": "#06b6d4"},
        {"name": "📅 Planner",     "score": planner_score, "color": "#f59e0b"},
        {"name": "🗺️ Roadmap",    "score": roadmap_score, "color": "#10b981"},
    ]

    # ── Skills from resume ────────────────────────────────────────────────────
    skill_scores = []
    for s in resume_skills[:8]:
        if isinstance(s, dict):
            skill_scores.append({"name": s.get("name","?"), "score": s.get("score", 70)})
        elif isinstance(s, str):
            skill_scores.append({"name": s, "score": 70})

    return {
        "overall_score":       overall_score,
        "resume_score":        resume_score,
        "communication_score": comm_score,
        "planner_score":       planner_score,
        "roadmap_score":       roadmap_score,
        "overall_trend":       0.0,
        "communication_trend": 0.0,
        "tasks_completed_today": tasks_done,
        "total_tasks_today":   total_tasks,
        "occupancy_rate":      occupancy,
        "streak_days":         streak,
        "skill_scores":        skill_scores,
        "resume_categories":   resume_categories,
        "weekly_data":         weekly_data,
        "module_scores":       module_scores,
        "roadmap_progress":    roadmap_progress,
        "emotion_status":      "focused",
        "emotion_detail":      "Active",
        "updated_at":          datetime.utcnow().isoformat(),
    }
