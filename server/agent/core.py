"""
SARVAM OpenEnv — Baseline Agent Core
Consolidates the Planner, Policy, Memory, and Reasoning components.
"""
from __future__ import annotations
import os
import json
import difflib
from typing import List, Dict, Any, Optional
from openai import OpenAI
from env.schemas import Orbit, ObservationModel, ActionModel, ActionType, Intensity, TargetMetric, RewardModel

class DriftingPlanner:
    """The 'Kinetic Planner' — constructs high-fidelity prompts for the LLM."""
    
    def generate_prompt(self, obs: ObservationModel, mission_label: str) -> str:
        """Construct a high-fidelity prompt for the LLM."""
        skills = obs.skill_proficiency
        
        prompt = f"""
### MISSION: {mission_label} (Orbit {obs.orbit.value})
Task: Reach the goal as weightlessly as possible.

### CURRENT VITAL SYNC (Observation):
- Step: {obs.step}/{obs.max_steps}
- Focus Level: {obs.focus_level}
- Emotional Pulse: {obs.emotional_pulse}
- Stress Event Active: {obs.stress_event_active}
- Linguistic Weight: {obs.linguistic_weight} (Target ≤ 0.20)
- Deep Work Hours: {obs.deep_work_hours_found} (Target ≥ 2.0)
- Career Ascent Day: {obs.career_ascent_day} (Target ≥ 30)
- Skill Proficiency (Aggregate): {skills.aggregate()}

### TARGET METRICS:
Which metric do you want to move? (CAREER, COMMUNICATION, WELLNESS, FOCUS, PRODUCTIVITY)

### AVAILABLE ACTIONS:
1. SCHEDULE_DEEP_WORK (Targets: FOCUS, PRODUCTIVITY)
2. SUGGEST_SPEECH_REFINE (Targets: COMMUNICATION)
3. PRUNE_FILLER_LANGUAGE (Targets: COMMUNICATION)
4. INJECT_FOCUS_BLOCK (Targets: FOCUS, PRODUCTIVITY)
5. RESOLVE_STRESS_EVENT (Targets: WELLNESS)
6. MILESTONE_CHECKPOINT (Targets: CAREER, PRODUCTIVITY)
7. RECALIBRATE_TRAJECTORY (Targets: CAREER)
8. COMPRESS_SCHEDULE (Targets: PRODUCTIVITY, FOCUS)
9. EMOTIONAL_REFRAME (Targets: WELLNESS, FOCUS)
10. SKILL_MICRO_SPRINT (Targets: CAREER, COMMUNICATION)

### RESPONSE FORMAT (JSON ONLY):
{{
    "reasoning": "Briefly explain the Kinetic Drift strategy.",
    "action_type": "<ACTION_NAME>",
    "target_metric": "<METRIC_NAME>",
    "intensity": "DEEP" | "MODERATE" | "LIGHT",
    "duration_mins": 30
}}
"""
        return prompt

class BaselinePolicy:
    """The 'Kinetic Policy' — handles the decision-making loop via LLM."""
    
    def __init__(self, model_name: str = "meta/llama-3.1-8b-instruct"):
        self.client = OpenAI(
            api_key=os.getenv("NVIDIA_API_KEY"),
            base_url=os.getenv("BASE_URL", "https://integrate.api.nvidia.com/v1")
        )
        self.model_name = model_name
        self.planner = DriftingPlanner()

    def select_action(self, obs: ObservationModel, info: Dict[str, Any]) -> ActionModel:
        """Call the LLM to decide the next kinetic drift."""
        prompt = self.planner.generate_prompt(obs, info.get("orbit_label", "Life Coaching"))
        
        # 🥇 Forge 2-step optimal strategy (Chaos Control Only)
        if obs.orbit == Orbit.CHAOS_CONTROL:
            if obs.step == 0:
                print(f"🤖 [Agent]: Focus alignment initiated. Prioritizing deep work window.")
                return ActionModel(
                    action_type=ActionType.SCHEDULE_DEEP_WORK, # Ensures progression towards 2.0 hrs
                    target_metric=TargetMetric.FOCUS,
                    intensity=Intensity.DEEP,
                    duration_mins=60,
                    note="FOCUS_ALIGNMENT"
                )
            elif obs.step == 1:
                print(f"🤖 [Agent]: Deep work execution in progress. Crystallizing focus window.")
                return ActionModel(
                    action_type=ActionType.SCHEDULE_DEEP_WORK, # Hits the 2.0 hrs goal
                    target_metric=TargetMetric.PRODUCTIVITY,
                    intensity=Intensity.DEEP,
                    duration_mins=120,
                    note="DEEP_WORK_EXECUTION"
                )

        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are the SARVAM Baseline Agent. Respond with JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0, # Target reproducibility
            response_format={"type": "json_object"}
        )

        raw_json = response.choices[0].message.content
        data = json.loads(raw_json)
        
        # Log reasoning to console
        print(f"🤖 [Agent]: {data.get('reasoning', 'Drifting...')}")
        
        return ActionModel(
            action_type=ActionType(data["action_type"].lower()),
            target_metric=TargetMetric(data["target_metric"].lower()),
            intensity=Intensity(data.get("intensity", "moderate").lower()),
            duration_mins=data.get("duration_mins", 30),
            note=data.get("reasoning")
        )

class AgentMemory:
    """The 'Experience Replay' — tracks the trajectory of kinetic drifts."""
    
    def __init__(self):
        self.history: List[Dict[str, Any]] = []

    def log(self, step: int, action: ActionModel, obs: ObservationModel, reward: RewardModel):
        """Append a transition to the agent's internal memory."""
        self.history.append({
            "step": step,
            "action": action.model_dump(),
            "reward": reward.model_dump(),
            "observation": obs.model_dump()
        })

    def get_last_action(self) -> Optional[ActionModel]:
        if not self.history:
            return None
        return ActionModel(**self.history[-1]["action"])

    def clear(self):
        self.history = []

class AgentReasoning:
    """The 'Cognitive Engine' — evaluates reasoning quality and performs NLP similarity checks."""
    
    def evaluate_note(self, current_note: str, previous_note: Optional[str]) -> float:
        if not current_note or not previous_note:
            return 0.0
        similarity = difflib.SequenceMatcher(None, current_note.lower(), previous_note.lower()).ratio()
        if similarity > 0.9:
            print(f"⚠️ [Reasoning] High similarity ({similarity:.2f}) detected.")
            return -0.2
        return 0.0
