import gymnasium as gym
import numpy as np
from typing import Dict, Any, Tuple, Optional
from env.schemas import Orbit, ObservationModel, ActionModel, ActionType, TargetMetric, Intensity, EnvState, RewardModel, SkillProficiency
from env.logic import run_auto_grader

class SarvamEnv(gym.Env):
    """
    SARVAM OpenEnv — gymnasium compliant environment for human career development.
    Simulates Focus, Emotional Pulse, and linguistic efficiency metrics.
    """
    def __init__(self, orbit: Orbit = Orbit.CHAOS_CONTROL, max_steps: int = 10, session_id: str = "default"):
        super().__init__()
        self.orbit = orbit
        self.max_steps = max_steps
        self.session_id = session_id
        self._reset_state()

    def _reset_state(self):
        self.current_step = 0
        self.focus_level = 0.5
        self.emotional_pulse = 0.8
        self.linguistic_weight = 1.0 if self.orbit == Orbit.NARRATIVE_SHIFT else 0.5
        self.deep_work_hours = 0.0
        self.career_ascent_day = 0
        self.stress_event_active = False
        self.skill_proficiency = SkillProficiency()
        self.history = []
        self.cumulative_reward = 0.0

    def reset(self, orbit: Optional[Orbit] = None, **kwargs) -> ObservationModel:
        if orbit: self.orbit = orbit
        self._reset_state()
        return self._get_obs()

    def _get_obs(self) -> ObservationModel:
        return ObservationModel(
            orbit=self.orbit,
            step=self.current_step,
            max_steps=self.max_steps,
            focus_level=round(self.focus_level, 2),
            emotional_pulse=round(self.emotional_pulse, 2),
            stress_event_active=self.stress_event_active,
            linguistic_weight=round(self.linguistic_weight, 2),
            deep_work_hours_found=round(self.deep_work_hours, 1),
            career_ascent_day=self.career_ascent_day,
            skill_proficiency=self.skill_proficiency
        )

    def step(self, action: ActionModel) -> Tuple[ObservationModel, float, bool, Dict[str, Any]]:
        self.current_step += 1
        
        # ── Drifting Logic — Kinetic Metric Shifting ──────────────────────────
        intensity_map = {Intensity.LIGHT: 0.05, Intensity.MODERATE: 0.1, Intensity.DEEP: 0.2}
        shift = intensity_map.get(action.intensity, 0.1)

        # Apply Action Effects
        if action.action_type == ActionType.SCHEDULE_DEEP_WORK:
            self.deep_work_hours += (shift * 5) # E.g. DEEP -> 1.0 hr
            self.focus_level = min(1.0, self.focus_level + shift)
            self.skill_proficiency.wellness -= 0.02 # Cost of focus

        elif action.action_type == ActionType.PRUNE_FILLER_LANGUAGE:
            self.linguistic_weight = max(0.0, self.linguistic_weight - shift)
            self.skill_proficiency.communication += shift

        elif action.action_type == ActionType.RESOLVE_STRESS_EVENT:
            self.emotional_pulse = min(1.0, self.emotional_pulse + shift)
            self.stress_event_active = False

        elif action.action_type == ActionType.MILESTONE_CHECKPOINT:
            self.career_ascent_day += int(shift * 50)
            self.skill_proficiency.career += shift

        # ── Reward & Penalties ────────────────────────────────────────────────
        step_penalty = -0.01
        stagnation_penalty = -0.05 if shift < 0.1 else 0.0
        
        obs = self._get_obs()
        dense_reward = shift * 2.0 # Proportional reward
        fidelity = run_auto_grader(self.orbit, obs, {})
        total_reward = dense_reward + step_penalty + stagnation_penalty
        self.cumulative_reward += total_reward

        reward_model = RewardModel(
            dense_reward=dense_reward,
            fidelity_score=fidelity,
            stagnation_penalty=stagnation_penalty,
            step_penalty=step_penalty,
            momentum_total=round(dense_reward + stagnation_penalty, 2),
            cumulative_reward=round(self.cumulative_reward, 2)
        )

        done = self.current_step >= self.max_steps
        
        info = {
            "orbit_label": self.orbit.name,
            "fidelity_score": fidelity,
            "truncated": False,
            "session_id": self.session_id
        }
        
        self.history.append({"step": self.current_step, "action": action.model_dump(), "obs": obs.model_dump()})
        return obs, reward_model, done, info

    def state(self) -> EnvState:
        return EnvState(
            session_id=self.session_id,
            orbit=self.orbit,
            observation=self._get_obs(),
            history=self.history,
            is_done=self.current_step >= self.max_steps
        )

    def grade(self) -> Dict[str, Any]:
        obs = self._get_obs()
        fidelity = run_auto_grader(self.orbit, obs, {})
        return {
            "session_id": self.session_id,
            "orbit": self.orbit.name,
            "fidelity_score": fidelity,
            "final_metrics": obs.model_dump(),
            "status": "Weightless" if fidelity > 0.8 else "Atmospheric"
        }

# ── Session Management ─────────────────────────────────────────────────────────

_sessions: Dict[str, SarvamEnv] = {}

def create_session(orbit: Orbit, session_id: str = "default") -> SarvamEnv:
    env = SarvamEnv(orbit=orbit, session_id=session_id)
    _sessions[session_id] = env
    return env

def get_session(session_id: str) -> Optional[SarvamEnv]:
    return _sessions.get(session_id)
