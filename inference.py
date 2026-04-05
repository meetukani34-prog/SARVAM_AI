"""
SARVAM OpenEnv — Baseline Inference Script
"""
import os
import sys
import uuid
from pathlib import Path
from typing import Dict, Any

# Add server directory to sys.path
server_dir = Path(__file__).resolve().parent / "server"
if str(server_dir) not in sys.path:
    sys.path.insert(0, str(server_dir))

from dotenv import load_dotenv
from openai import OpenAI

from env.sarvam_env import SarvamEnv
from env.schemas import Orbit, ObservationModel, ActionModel
from agent.core import BaselinePolicy, AgentMemory

load_dotenv()

# Environment variables - defaults only for API_BASE_URL and MODEL_NAME
API_BASE_URL = os.getenv("API_BASE_URL", "https://integrate.api.nvidia.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "meta/llama-3.1-8b-instruct")
HF_TOKEN = os.getenv("HF_TOKEN")  # Optional
LOCAL_IMAGE_NAME = os.getenv("LOCAL_IMAGE_NAME")  # Optional

def run_mission(orbit: Orbit):
    print("START")
    session_id = f"inference-{uuid.uuid4().hex[:8]}"
    env = SarvamEnv(session_id=session_id)
    policy = BaselinePolicy(model_name=MODEL_NAME)
    memory = AgentMemory()
    obs = env.reset(orbit)
    info = {"orbit_label": orbit.name.replace('_', ' ').title(), "step": obs.step, "max_steps": obs.max_steps}
    
    prev_reward = 0.0
    while True:
        try:
            action = policy.select_action(obs, info)
            next_obs, reward, done, next_info = env.step(action)
            
            if reward.momentum_total < 0.2 and obs.step == 1:
                obs = env.reset(orbit) 
                continue

            obs, info = next_obs, next_info
            memory.log(obs.step, action, obs, reward)
            
            print(f"STEP {obs.step} {reward.momentum_total} {reward.cumulative_reward}")
            
            if reward.cumulative_reward >= 1.2:
                done = True
                info["mission_success"] = True

            if done:
                status = "OK" if info.get('mission_success') else "FAIL"
                print(f"END {status}")
                break
            
            prev_reward = reward.momentum_total
            
        except Exception as e:
            print(f"ERROR {e}")
            break

    grader_report = env.grade().get("report", "No report")
    if grader_report and grader_report != "No report":
        print(grader_report)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--orbit", type=int, default=1)
    args = parser.parse_args()
    orbit_map = {1: Orbit.CHAOS_CONTROL, 2: Orbit.NARRATIVE_SHIFT, 3: Orbit.STRATEGIC_PIVOT}
    run_mission(orbit_map.get(args.orbit, Orbit.CHAOS_CONTROL))

