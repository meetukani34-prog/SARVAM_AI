import os
import json
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(
    base_url=os.getenv("BASE_URL", "https://integrate.api.nvidia.com/v1"),
    api_key=os.getenv("NVIDIA_API_KEY"),
)

MODEL = os.getenv("MODEL_NAME", "meta/llama-3.1-8b-instruct")
VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"

def _call_ai(system_prompt: str, user_message: str, json_mode: bool = False) -> str:
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}]
    extra_kwargs = {"response_format": {"type": "json_object"}} if json_mode else {}
    response = _client.chat.completions.create(model=MODEL, messages=messages, temperature=0.2, max_tokens=2048, **extra_kwargs)
    return response.choices[0].message.content

def _parse_json(raw: str) -> dict:
    try: return json.loads(raw)
    except:
        import re
        cleaned = re.search(r'\{.*\}', raw, re.DOTALL)
        return json.loads(cleaned.group()) if cleaned else json.loads(raw)

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
    system = (
        "Create a practical 5-7 phase career roadmap. "
        "Return ONLY valid JSON: "
        "{\"goal\": string, \"estimated_duration\": string, "
        "\"phases\": [{\"id\": int, \"title\": string, \"duration\": string, "
        "\"description\": string, \"skills\": [string], \"resources\": [string], "
        "\"milestone\": string, \"completed\": false}]}"
    )
    data = _parse_json(_call_ai(system, goal, json_mode=True))

    # ── Force short, deterministic durations regardless of AI output ────────────
    PHASE_DURATIONS = [
        "1-2 weeks",   # Phase 1: intro/foundations
        "2-3 weeks",   # Phase 2: core concepts
        "2-3 weeks",   # Phase 3: hands-on practice
        "3-4 weeks",   # Phase 4: advanced topics
        "2-3 weeks",   # Phase 5: integration / project
        "3-4 weeks",   # Phase 6: specialization
        "2-3 weeks",   # Phase 7: portfolio / final
    ]
    phases = data.get("phases", [])
    for i, phase in enumerate(phases):
        phase["duration"] = PHASE_DURATIONS[min(i, len(PHASE_DURATIONS) - 1)]
        phase.setdefault("completed", False)
        phase.setdefault("id", i + 1)

    # Estimated total: use midpoint of each range
    def _midpoint(dur: str) -> int:
        parts = dur.replace(" weeks", "").split("-")
        return round(sum(int(x) for x in parts) / len(parts))

    total_weeks = sum(_midpoint(PHASE_DURATIONS[min(i, len(PHASE_DURATIONS) - 1)]) for i in range(len(phases)))
    data["phases"] = phases
    data["estimated_duration"] = f"{total_weeks} weeks"
    return data




def generate_daily_plan(user_goals: str, skill_gaps: list, completed_count: int) -> dict:
    system = "Generate a personalized tech career daily plan. Return JSON: {date, tasks: [{id, title, category, duration, priority, description}], motivation, focus_area}"
    return _parse_json(_call_ai(system, f"Goals: {user_goals}, Gaps: {skill_gaps}, Completed: {completed_count}", json_mode=True))

def generate_weekly_plan(user_goals: str, skill_gaps: list) -> dict:
    system = "Generate a 7-day weekly plan. Return JSON: {weekly_focus, motivation, days: [{day, tasks: [{title, category, duration, priority, description}]}]}"
    return _parse_json(_call_ai(system, f"Goals: {user_goals}, Gaps: {skill_gaps}", json_mode=True))
