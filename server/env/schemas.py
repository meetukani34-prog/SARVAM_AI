from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class Orbit(Enum):
    CHAOS_CONTROL = 1
    NARRATIVE_SHIFT = 2
    STRATEGIC_PIVOT = 3

class ActionType(str, Enum):
    SCHEDULE_DEEP_WORK = "schedule_deep_work"
    SUGGEST_SPEECH_REFINE = "suggest_speech_refine"
    PRUNE_FILLER_LANGUAGE = "prune_filler_language"
    INJECT_FOCUS_BLOCK = "inject_focus_block"
    RESOLVE_STRESS_EVENT = "resolve_stress_event"
    MILESTONE_CHECKPOINT = "milestone_checkpoint"
    RECALIBRATE_TRAJECTORY = "recalibrate_trajectory"
    COMPRESS_SCHEDULE = "compress_schedule"
    EMOTIONAL_REFRAME = "emotional_reframe"
    SKILL_MICRO_SPRINT = "skill_micro_sprint"

class TargetMetric(str, Enum):
    CAREER = "career"
    COMMUNICATION = "communication"
    WELLNESS = "wellness"
    FOCUS = "focus"
    PRODUCTIVITY = "productivity"

class Intensity(str, Enum):
    LIGHT = "light"
    MODERATE = "moderate"
    DEEP = "deep"

class ActionModel(BaseModel):
    action_type: ActionType
    target_metric: TargetMetric
    intensity: Intensity = Intensity.MODERATE
    duration_mins: int = 30
    note: Optional[str] = None

class SkillProficiency(BaseModel):
    career: float = 0.0
    communication: float = 0.0
    wellness: float = 0.0
    
    def aggregate(self) -> float:
        return round((self.career + self.communication + self.wellness) / 3, 2)

class ObservationModel(BaseModel):
    orbit: Orbit
    step: int
    max_steps: int
    focus_level: float = Field(..., ge=0, le=1)
    emotional_pulse: float = Field(..., ge=0, le=1)
    stress_event_active: bool = False
    linguistic_weight: float = Field(..., ge=0, le=1)
    deep_work_hours_found: float = 0.0
    career_ascent_day: int = 0
    skill_proficiency: SkillProficiency = Field(default_factory=SkillProficiency)

class RewardModel(BaseModel):
    dense_reward: float
    fidelity_score: float
    stagnation_penalty: float = 0.0
    step_penalty: float = -0.01
    momentum_total: float = 0.0
    cumulative_reward: float = 0.0

class EnvState(BaseModel):
    session_id: str
    orbit: Orbit
    observation: ObservationModel
    history: List[Dict[str, Any]] = []
    is_done: bool = False
