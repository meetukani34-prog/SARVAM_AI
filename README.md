# SARVAM OpenEnv — The Digital Life-Coach Twin

![SARVAM License](https://img.shields.io/badge/Status-RL--Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0--Kinetic-blue)
![Docker](https://img.shields.io/badge/Deployment-Containerized-blueviolet)

**SARVAM OpenEnv** is a high-fidelity, Gymnasium-compliant reinforcement learning environment designed to train the next generation of **AI Digital Twins**. It simulates a "Growth Equilibrium" where agents must balance career acceleration, communication precision, and emotional resilience to reach a state of **Weightlessness**.

---

## 🌌 Environment Overview

The environment operates on a multi-dimensional "Kinetic Drift" logic. Unlike typical static simulations, SARVAM OpenEnv uses **Incremental Scoring** and **Momentum Deltas** to provide dense reward signals to the agent.

- **Type**: `gymnasium.Env`
- **Dynamics**: Discrete Actions → Continuous Metric Shifting
- **Focus**: Cognitive Optimization & Linguistic Refinement

---

## 📊 Observation & 🎮 Action Space

### Observation Space (The Pydantic State)
The environment returns a strict `ObservationModel` at every step:

| Metric | Type | Target | Description |
| :--- | :--- | :--- | :--- |
| `focus_level` | `float [0-1]` | Higher | Capacity for deep work and concentration. |
| `emotional_pulse` | `float [0-1]` | Higher | Stability following stress events or emotional dips. |
| `linguistic_weight` | `float [0-1]` | Lower (≤ 0.20) | Presence of "filler" language and narrative noise. |
| `career_ascent_day` | `int [0-30]` | ≥ 30 | Progress through a 30-day professional pivot. |
| `deep_work_found` | `float` | ≥ 2.0 hrs | Hours of high-density focus discovered. |
| `skill_proficiency` | `Vector` | Aggregate | Profiling across Career, Wellness, and Communication. |

### Action Space (Levitation Actions)
The agent interacts via defined `ActionType` models:

- **`PRUNE_FILLER_LANGUAGE`**: Reduces Linguistic Weight.
- **`SCHEDULE_DEEP_WORK`**: Increases Focus and Productivity.
- **`RESOLVE_STRESS_EVENT`**: Restores Emotional Pulse.
- **`MILESTONE_CHECKPOINT`**: Accelerates Career Ascent.
- **`EMOTIONAL_REFRAME`**: Mitigates Stress penalties.

---

## 🏆 Task Tiers & Graders

The environment includes a 3-tier difficulty system, each with a dedicated **Auto-Grader** that returns a standardized `[0.0, 1.0]` fidelity score.

1.  **🚀 Orbit 1: Chaos Control (Easy)**
    - *Goal*: Optimize a chaotic schedule to find 2.0 hours of Deep Work.
    - *Grader*: `grade_easy()` focuses on schedule efficiency.
2.  **🗣️ Orbit 2: Narrative Shift (Medium)**
    - *Goal*: Radically reduce linguistic fillers from 1.0 to ≤ 0.20 weight.
    - *Grader*: `grade_medium()` reward for weight reduction precision.
3.  **⛰️ Orbit 3: Strategic Pivot (Hard)**
    - *Goal*: Complete a 30-day career pivot while surviving an "Emotional Dip" stress event.
    - *Grader*: `grade_hard()` combined score (80% Ascent + 20% Resilience).

---

## 🛠️ Setup & Installation

### Local Development
1. **Prepare Environment**:
   ```powershell
   cd server
   pip install -r requirements.txt
   ```
2. **Configure API Keys**:
   Create a `.env` file in the `server/` directory:
   ```env
   NVIDIA_API_KEY=your_key_here
   BASE_URL=https://integrate.api.nvidia.com/v1
   MODEL_NAME=meta/llama3-70b-instruct
   ```
3. **Launch Server**:
   ```powershell
   python -m uvicorn app.main:app --reload
   ```

### Docker Deployment (Recommended)
Build and run the entire suite (Backend + Database + Environment) via Docker:
```bash
docker-compose up --build
```

---

## 🤖 Baseline Evaluation

To evaluate an LLM agent's performance, use the provided inference script:
```powershell
# Run the Easy mission baseline
python server/inference.py --orbit 1
```
Trajectories and Auto-Grader reports will be saved to `server/logs/`.

---

> [!IMPORTANT]
> This environment is built for **Reinforcement Learning**. Each step incurs a **Step Penalty (-0.01)** and **Stagnation Penalty (-0.05)**. Be weightless. Be efficient.
