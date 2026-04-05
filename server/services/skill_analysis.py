import re
from typing import List, Tuple

SKILL_KEYWORDS = {
    "programming": ["python", "javascript", "typescript", "java", "go", "rust"],
    "frontend": ["react", "vue", "nextjs", "tailwind", "html", "css"],
    "backend": ["fastapi", "django", "nodejs", "rest api", "graphql"],
    "database": ["sql", "mysql", "postgresql", "mongodb", "redis"],
    "devops": ["docker", "kubernetes", "aws", "ci/cd", "git"],
    "ai_ml": ["machine learning", "deep learning", "pytorch", "llm", "openai"],
    "soft_skills": ["communication", "leadership", "teamwork", "agile"]
}

def extract_skills_from_text(text: str) -> Tuple[List[str], dict]:
    found, categorized = [], {}
    for cat, kws in SKILL_KEYWORDS.items():
        cat_found = [kw for kw in kws if re.search(r'\b' + re.escape(kw) + r'\b', text.lower())]
        if cat_found:
            categorized[cat] = cat_found
            for kw in cat_found:
                if kw not in found: found.append(kw)
    return found, categorized

def calculate_skill_score(found_skills: List[str], categorized: dict) -> dict:
    scores = {}
    for cat, kws in SKILL_KEYWORDS.items():
        found_in_cat = len(categorized.get(cat, []))
        scores[cat] = round(min((found_in_cat / max(len(kws) * 0.3, 1)) * 100, 100), 1)
    return scores
