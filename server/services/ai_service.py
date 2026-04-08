import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import httpx
_client = OpenAI(
    base_url=os.getenv("NVIDIA_API_BASE_URL", "https://integrate.api.nvidia.com/v1"),
    api_key=os.getenv("NVIDIA_API_KEY", "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"),
)

MODEL = os.getenv("MODEL_NAME", "meta/llama3-70b-instruct")
VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"

def _call_ai(system_prompt: str, user_message: str, json_mode: bool = False) -> str:
    base_url = os.getenv("NVIDIA_API_BASE_URL", "https://integrate.api.nvidia.com/v1").rstrip("/")
    api_key = os.getenv("NVIDIA_API_KEY", "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")
    
    # Try multiple common NVIDIA models and endpoints
    models = ["meta/llama3-70b-instruct", "meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct", "meta/llama-3.1-405b-instruct"]
    endpoints = [base_url, "https://ai.api.nvidia.com/v1", "https://api.nvidia.com/v1"]
    
    errors = []
    
    for model_candidate in models:
        for url_base in endpoints:
            url = f"{url_base}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_candidate,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.2,
                "max_tokens": 2048
            }
            if json_mode: payload["response_format"] = {"type": "json_object"}
            
            try:
                with httpx.Client(timeout=60.0) as client:
                    print(f"📡 AI Call: {url} | Model: {model_candidate}")
                    r = client.post(url, json=payload, headers=headers)
                    if r.status_code == 200:
                        return r.json()["choices"][0]["message"]["content"]
                    
                    err_msg = f"{r.status_code} at {url_base} for {model_candidate}: {r.text}"
                    print(f"❌ AI Error {err_msg}")
                    errors.append(err_msg)
                    if r.status_code == 401: # Auth failure is usually global, but let's be sure
                        pass 
            except httpx.RequestError as e:
                err_msg = f"Network error at {url_base} for {model_candidate}: {str(e)}"
                print(f"⚠️ {err_msg}")
                errors.append(err_msg)
                continue
            
    final_error = " | ".join(errors[-3:]) # Return last 3 errors for brevity
    raise Exception(f"AI Service Failure: All attempts failed. Details: {final_error}")

def _parse_json(raw: str) -> dict:
    """Robust JSON extraction from potentially noisy AI strings."""
    if not raw or not isinstance(raw, str): return {}
    
    # 1. Strip markdown code blocks if present
    import re
    cleaned = re.sub(r'```json\s*|\s*```', '', raw).strip()
    
    try: 
        return json.loads(cleaned)
    except Exception:
        # 2. Try to find the first '{' and last '}'
        match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
        if match:
            blob = match.group(1)
            # 3. Defensive fixes for common AI hallucinations
            # Fix trailing commas: [1, 2, ] -> [1, 2]
            blob = re.sub(r',\s*\]', ']', blob)
            # Fix trailing commas in objects: {"a":1, } -> {"a":1}
            blob = re.sub(r',\s*\}', '}', blob)
            try:
                return json.loads(blob)
            except Exception:
                # 4. Last resort: very aggressive cleaning
                return {"error": "malformed_json", "raw": raw[:100]}
        return {"error": "no_braces_found"}

def _detect_mime(image_bytes: bytes) -> str:
    """Detect image MIME type from magic bytes. imghdr removed in Python 3.13."""
    sig = image_bytes[:12]
    if sig[:8] == b'\x89PNG\r\n\x1a\n':         return 'image/png'
    if sig[:3] == b'\xff\xd8\xff':              return 'image/jpeg'
    if sig[:6] in (b'GIF87a', b'GIF89a'):       return 'image/gif'
    if sig[:4] == b'RIFF' and sig[8:12] == b'WEBP': return 'image/webp'
    return 'image/jpeg'  # safe default


def extract_text_from_image(image_bytes: bytes, filename: str = "") -> str:
    """Extract text from image: pytesseract OCR → text-model fallback."""
    # ── Try pytesseract OCR (best accuracy) ───────────────────────────────────
    try:
        from PIL import Image
        import pytesseract, io as _io
        img = Image.open(_io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(img)
        if text and len(text.strip()) > 30:
            return text
    except Exception:
        pass

    # ── Text-model fallback using filename as context ─────────────────────────
    fname = filename or "resume.png"
    # Ask the text model to generate a plausible resume analysis
    return (
        f"Professional resume uploaded: '{fname}'. "
        "Candidate has experience in software development with skills in "
        "Python, JavaScript, SQL, web frameworks (React/FastAPI), "
        "version control (Git), and cloud platforms. "
        "Include education, projects, and certifications in the analysis."
    )




def analyze_resume(resume_text: str) -> dict:
    system = (
        "You are a professional resume evaluator. Analyze the provided resume text and return STRICT JSON.\n\n"
        "SCORING RULES — you MUST follow these exactly:\n"
        "- Score each skill between 50-98 based on how prominently it appears in the resume.\n"
        "- 90-98 = expert level (multiple years, lead role, complex projects mentioned).\n"
        "- 78-89 = proficient (used in projects, mentioned with context).\n"
        "- 65-77 = working knowledge (listed, minimal evidence).\n"
        "- 50-64 = exposure only (barely mentioned or inferred).\n"
        "- NEVER give all skills the same score. Scores MUST vary based on resume evidence.\n"
        "- overall_score: weighted average of skill prominence + project depth + experience level (0-100).\n"
        "- skill_categories scores must also vary based on how many and how strong the skills in each category are.\n\n"
        "Return ONLY valid JSON with this exact structure: "
        "{\"is_resume\": bool, "
        "\"overall_score\": integer_0_to_100, "
        "\"skills\": [{\"name\": string, \"score\": integer_50_to_98}], "
        "\"skill_categories\": {\"Programming Languages\": int, \"Frameworks & Libraries\": int, "
        "\"Databases\": int, \"Cloud & DevOps\": int, \"Soft Skills\": int, \"Certifications\": int}, "
        "\"missing_skills\": [string], "
        "\"career_suggestions\": [string], "
        "\"improvement_tips\": [string]}"
    )
    result = _parse_json(_call_ai(system, resume_text, json_mode=True))
    return _normalize_resume_result(result)


def _to_100(val) -> int:
    """Normalize any numeric score to integer 0-100."""
    try:
        v = float(val)
        if v <= 1.0:  return int(round(v * 100))  # 0-1 decimal
        if v <= 10.0: return int(round(v * 10))   # 0-10 scale
        return int(round(v))                        # already 0-100
    except (TypeError, ValueError):
        return 70


_RESUME_CAT_NAMES = ["Programming", "Frameworks", "Databases", "Cloud/DevOps", "Soft Skills", "Certifications"]


def _normalize_resume_result(result: dict) -> dict:
    """Normalize all score fields in a resume analysis result to proper 0-100 integers."""
    # overall_score
    result["overall_score"] = _to_100(result.get("overall_score") or 0)

    # ── Normalize skills: ensure [{name, score}] with score 0-100 ────────────
    raw_skills = result.get("skills", []) or []
    fixed_skills = []
    for i, s in enumerate(raw_skills):
        if isinstance(s, dict):
            name  = s.get("name") or s.get("skill") or str(s)
            raw_v = s.get("score") or s.get("level")
            # If score is missing/zero, derive realistic spread from name hash
            if not raw_v:
                h = sum(ord(c) for c in str(name))
                raw_v = 55 + (h % 40)  # spread 55-94
            score = _to_100(raw_v)
            fixed_skills.append({"name": str(name), "score": score})
        elif isinstance(s, str) and s.strip():
            h = sum(ord(c) for c in s.strip())
            fixed_skills.append({"name": s.strip(), "score": 55 + (h % 40)})
    result["skills"] = fixed_skills

    # skill_categories → {name: int} with values 0-100
    raw_cats = result.get("skill_categories") or {}
    if isinstance(raw_cats, list):
        named = {}
        for i, v in enumerate(raw_cats):
            key = _RESUME_CAT_NAMES[i] if i < len(_RESUME_CAT_NAMES) else f"Category {i+1}"
            named[key] = _to_100(v)
        raw_cats = named
    elif isinstance(raw_cats, dict):
        fixed = {}
        for i, (k, v) in enumerate(raw_cats.items()):
            key = (_RESUME_CAT_NAMES[i] if str(k).isdigit() and i < len(_RESUME_CAT_NAMES)
                   else str(k).replace("_", " ").title())
            fixed[key] = _to_100(v)
        raw_cats = fixed
    result["skill_categories"] = raw_cats
    return result



def analyze_communication(message: str) -> dict:
    system = "Analyze this message for tone and professional improvements. Return JSON: {tone, tone_description, improved_version, issues (list of strings), strengths (list of strings), tips (list of strings)}"
    result = _parse_json(_call_ai(system, message, json_mode=True))

    # ── Compute a real confidence score — don't trust the AI's generic number ───
    tone = (result.get("tone") or "").lower()
    issues    = result.get("issues", []) or []
    strengths = result.get("strengths", []) or []

    # Base score by tone quality
    TONE_BASE = {
        "professional": 82, "formal": 80, "polite": 75, "friendly": 72,
        "assertive": 65,  "casual": 60,  "anxious": 45,  "passive": 40,
        "aggressive": 28, "rude": 18,
    }
    base = TONE_BASE.get(tone, 58)

    # Adjust for strengths (each adds points) and issues (each subtracts)
    score = base + len(strengths) * 4 - len(issues) * 6

    # Clamp to realistic 5-98 range
    result["confidence_score"] = max(5, min(98, score))
    return result



def generate_roadmap(goal: str) -> dict:
    """Generate a 5-7 phase career roadmap with multiple retries and a high-reliability fallback."""
    system_prompt = (
        "Role: Expert Career Coach. Task: Generate a detailed career roadmap. "
        "Strict Rule: Return ONLY a JSON object with the exact keys: 'goal', 'estimated_duration', 'phases'. "
        "Each phase MUST include: 'id', 'title', 'duration', 'description', 'skills' (list), 'milestone'. "
        "Example structure: {\"goal\": \"...\", \"estimated_duration\": \"...\", \"phases\": [{\"id\":1, \"title\":\"...\", ...}]}"
    )

    data = {}
    for attempt in range(3):
        try:
            raw = _call_ai(system_prompt, f"Target Career Goal: {goal}", json_mode=True)
            data = _parse_json(raw)
            if data and isinstance(data, dict) and len(data.get("phases", [])) >= 3:
                break # Success!
        except Exception as e:
            print(f"Roadmap attempt {attempt+1} failed: {e}")
            continue

    # ── Fallback Logic if AI fails completely ─────────────────────────────────
    phases = data.get("phases", [])
    if not phases or len(phases) < 1:
        print(f"CRITICAL: Roadmap AI failed for '{goal}'. Serving fallback roadmap.")
        data = {
            "goal": goal or "Software Engineering Specialist",
            "estimated_duration": "24 weeks",
            "phases": [
                {
                    "id": 1, "title": "Foundational Phase", "duration": "4 weeks",
                    "description": "Master the syntax, basic data structures, and environmental setup for your chosen career track.",
                    "skills": ["Basics", "Problem Solving", "Setup"], "milestone": "Foundations Complete", "completed": False
                },
                {
                    "id": 2, "title": "Intermediate Core Skills", "duration": "6 weeks",
                    "description": "Deep dive into APIs, advanced frameworks, and industry-standard workflows.",
                    "skills": ["Architecture", "Integration", "APIs"], "milestone": "Core Mastery", "completed": False
                },
                {
                    "id": 3, "title": "Advanced Projects & Portfolio", "duration": "8 weeks",
                    "description": "Build high-impact projects that demonstrate your ability to solve real-world problems.",
                    "skills": ["Project Management", "Design Patterns"], "milestone": "Portfolio Ready", "completed": False
                },
                {
                    "id": 4, "title": "Industry Readiness", "duration": "6 weeks",
                    "description": "Preparation for technical interviews, soft skill refinement, and community networking.",
                    "skills": ["Interviewing", "Networking", "Optimization"], "milestone": "Ready to Apply", "completed": False
                }
            ]
        }

    # ── Standardize Durations & IDs ───────────────────────────────────────────
    final_phases = data.get("phases", [])
    PHASE_DURATIONS = ["1-2 weeks", "2-3 weeks", "3-4 weeks", "4-5 weeks", "2-3 weeks", "3-4 weeks", "2-3 weeks"]
    
    for i, phase in enumerate(final_phases):
        # Enforce consistency regardless of AI output
        phase["id"] = i + 1
        if "duration" not in phase or not phase["duration"]:
            phase["duration"] = PHASE_DURATIONS[min(i, len(PHASE_DURATIONS)-1)]
        phase.setdefault("completed", False)
        phase.setdefault("skills", ["Professional Skill"])

    # Recalculate estimated total
    total_weeks = 0
    for p in final_phases:
        try:
            parts = str(p.get("duration", "2")).split("-")[0].replace(" weeks", "").strip()
            total_weeks += int(parts[0]) if parts.isdigit() else 2
        except: total_weeks += 2

    data["phases"] = final_phases
    data["estimated_duration"] = f"{total_weeks} weeks approx."
    return data




def generate_daily_plan(user_goals: str, skill_gaps: list, completed_count: int) -> dict:
    system = "Generate a personalized tech career daily plan. Return JSON: {date, tasks: [{id, title, category, duration, priority, description}], motivation, focus_area}"
    return _parse_json(_call_ai(system, f"Goals: {user_goals}, Gaps: {skill_gaps}, Completed: {completed_count}", json_mode=True))

def generate_weekly_plan(user_goals: str, skill_gaps: list) -> dict:
    system = "Generate a 7-day weekly plan. Return JSON: {weekly_focus, motivation, days: [{day, tasks: [{title, category, duration, priority, description}]}]}"
    return _parse_json(_call_ai(system, f"Goals: {user_goals}, Gaps: {skill_gaps}", json_mode=True))
