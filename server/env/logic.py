from typing import Dict, Any
from env.schemas import Orbit, ObservationModel

def run_auto_grader(orbit: Orbit, obs: ObservationModel, info: Dict[str, Any]) -> float:
    """Evaluate and score the agent's performance based on the specific orbit goal."""
    if orbit == Orbit.CHAOS_CONTROL:
        # Easy: Goal -> 2.0 hours of Deep Work
        # Reward based on proximity to 2.0 and focus level
        score = min(1.0, obs.deep_work_hours_found / 2.0)
        return round(score * 0.8 + obs.focus_level * 0.2, 2)
    
    elif orbit == Orbit.NARRATIVE_SHIFT:
        # Medium: Goal -> Reduce Linguistic Weight from 1.0 to ≤ 0.20
        # Linear reward for reduction
        reduction = 1.0 - obs.linguistic_weight
        score = min(1.0, reduction / 0.8) if obs.linguistic_weight <= 0.20 else reduction * 0.5
        return round(score, 2)
    
    elif orbit == Orbit.STRATEGIC_PIVOT:
        # Hard: Goal -> 30-day career pivot + survivability
        ascent_score = min(1.0, obs.career_ascent_day / 30.0)
        resilience_score = obs.emotional_pulse
        return round(ascent_score * 0.8 + resilience_score * 0.2, 2)
    
    return 0.0
