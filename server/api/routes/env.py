from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any

from env.schemas import Orbit, ObservationModel, EnvState, ActionModel
from models.schemas import ResetRequest, StepRequest, StepResult
from env.sarvam_env import create_session, get_session, get_session as _get_session
from env.logic import run_auto_grader

router = APIRouter()

@router.post("/reset", response_model=ObservationModel)
def reset_environment(req: ResetRequest):
    try:
        orbit_enum = Orbit(req.orbit)
        env = create_session(orbit=orbit_enum, session_id=req.session_id)
        return env.reset(orbit_enum)
    except Exception as e: raise HTTPException(status_code=400, detail=str(e))

@router.post("/step", response_model=StepResult)
def step_environment(req: StepRequest):
    env = get_session(req.session_id)
    if not env: raise HTTPException(status_code=404, detail="Session not found")
    try:
        # Compatibility: Parse incoming action dict into ActionModel if it's not already one
        action = ActionModel(**req.action) if isinstance(req.action, dict) else req.action
        observation, reward, done, info = env.step(action)
        return StepResult(observation=observation, reward=reward, done=done, truncated=info.get("truncated", False), info=info)
    except Exception as e: raise HTTPException(status_code=422, detail=str(e))

@router.get("/state", response_model=EnvState)
def get_state(session_id: str = Query(...)):
    env = get_session(session_id)
    if not env: raise HTTPException(status_code=404, detail="Session not found")
    return env.state()

@router.get("/grader")
def grade_session(session_id: str = Query(...)):
    env = get_session(session_id)
    if not env: raise HTTPException(status_code=404, detail="Session not found")
    return env.grade()
