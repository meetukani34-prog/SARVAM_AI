from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str
    name: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    is_new_user: Optional[bool] = False

class SetPasswordRequest(BaseModel):
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_initials: str
    created_at: datetime
    class Config: from_attributes = True

# ── AI Services ───────────────────────────────────────────────────────────────

class ResumeAnalysisResponse(BaseModel):
    skills: List[str]
    missing_skills: List[str]
    career_suggestions: List[str]
    improvement_tips: List[str]
    overall_score: int
    skill_categories: dict

class ChatAnalyzeRequest(BaseModel): message: str

class ChatAnalyzeResponse(BaseModel):
    tone: str
    tone_description: str
    improved_version: str
    confidence_score: int
    issues: List[str]
    strengths: List[str]
    tips: List[str]

# ── Career ────────────────────────────────────────────────────────────────────

class RoadmapGenerateRequest(BaseModel): goal: str

class RoadmapStep(BaseModel):
    id: int
    title: str
    duration: str
    description: str
    skills: List[str]
    resources: List[str]
    milestone: str
    completed: bool = False

class RoadmapResponse(BaseModel):
    id: Optional[int] = None
    goal: str
    estimated_duration: str
    phases: List[dict]

class RoadmapProgressRequest(BaseModel):
    phase_id: int
    completed: bool

class PlannerTask(BaseModel):
    id: int
    title: str
    category: str
    duration: str
    priority: str
    description: str
    completed: bool

class PlannerResponse(BaseModel):
    date: str
    tasks: List[PlannerTask]
    motivation: str
    focus_area: str
    planner_type: str = "daily"

class CompleteTaskRequest(BaseModel):
    task_id: int
    completed: bool

class CreateTaskRequest(BaseModel):
    title: str
    category: str = "study"
    duration: str = "30 mins"
    priority: str = "medium"
    description: str = ""
    date: str
    planner_type: str = "daily"
    day_of_week: Optional[str] = None

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    day_of_week: Optional[str] = None
    completed: Optional[bool] = None

# ── Dashboard ──────────────────────────────────────────────────────────────────

class SkillScore(BaseModel):
    name: str
    score: float
    category: str

class WeeklyDataPoint(BaseModel):
    day: str
    score: float
    communication: float
    skills: float

class DashboardResponse(BaseModel):
    user_name: str
    skill_scores: List[SkillScore]
    overall_score: float
    communication_score: float
    emotion_status: str
    emotion_detail: str
    weekly_data: List[WeeklyDataPoint]
    streak_days: int
    tasks_completed_today: int

# ── SARVAM OpenEnv ────────────────────────────────────────────────────────────

class ResetRequest(BaseModel):
    orbit: int = 1
    session_id: Optional[str] = None

class StepRequest(BaseModel):
    session_id: str
    action: Any # Uses ActionModel from env.schemas

class StepResult(BaseModel):
    observation: Any
    reward: Any
    done: bool
    truncated: bool
    info: dict
