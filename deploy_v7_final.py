import os
from huggingface_hub import HfApi, CommitOperationAdd
from dotenv import load_dotenv

load_dotenv()

t = os.environ.get("HF_TOKEN", "hf_PlaceholderTokenForGitHub")
r = "Meetukani/sarvam-dashboard"
api = HfApi(token=t)

# A more comprehensive file list to ensure synchronization
target_files = [
    "server/api/routes/auth.py",
    "server/api/routes/ai_services.py",
    "server/api/routes/career.py",
    "server/api/routes/dashboard.py",
    "server/api/routes/env.py",
    "server/api/routes/history.py",
    "server/api/routes/openenv.py",
    "server/api/main.py",
    "client/src/pages/Dashboard.jsx",
    "client/src/pages/ResumeAnalyzer.jsx",
    "client/src/pages/ChatCoach.jsx",
    "client/src/components/Layout.jsx",
    "server/services/ai_service.py",
    "Dockerfile",
    "README.md",
    "client/src/index.css",
    "client/src/pages/Planner.jsx",
    "client/src/pages/CareerRoadmap.jsx",
    "client/src/pages/CodeOracle.jsx",
    "client/src/services/api.js",
    "inference.py",
    "server/database/core.py",
    ".gitignore",
    "server/env/logic.py",
    "server/env/sarvam_env.py",
    "server/env/schemas.py",
    "server/api/__init__.py",
    "server/config/__init__.py",
    "server/database/__init__.py",
    "server/env/__init__.py",
    "server/models/__init__.py",
    "server/models/schemas.py",
    "server/services/__init__.py",
    "client/.env",
    "client/src/pages/Login.jsx",
    "openenv.yaml",
    "pyproject.toml"
]

ops = []
for f in target_files:
    if os.path.exists(f):
        ops.append(CommitOperationAdd(path_in_repo=f, path_or_fileobj=f))
    else:
        print(f"⚠️ Skipping missing file: {f}")

print(f"Pushing {len(ops)} critical files to {r}...")
api.create_commit(
    repo_id=r,
    repo_type="space",
    operations=ops,
    commit_message="V8.6: Added missing pyproject.toml for multi-mode deployment",
    token=t
)

# Set Space Variables & Secrets (with Collision Handling)
print("[CONFIG] Updating Space configuration...")

def clear_set(key, value, type="var"):
    try:
        if type == "var":
            api.delete_space_secret(repo_id=r, key=key, token=t)
        else:
            api.delete_space_variable(repo_id=r, key=key, token=t)
    except: pass
    
    if type == "var":
        api.add_space_variable(repo_id=r, key=key, value=value, token=t)
    else:
        api.add_space_secret(repo_id=r, key=key, value=value, token=t)

clear_set("BUILD_ID", "V8_6_PYPROJECT_FIX", "var")
clear_set("GOOGLE_CLIENT_ID", "841476632281-a8sa47cfc04vn0vn7i5rotn1moiejpp2.apps.googleusercontent.com", "secret")
clear_set("SECRET_KEY", "sarvam-auth-v8-luminous-integrity-alpha-99", "secret")

# Force factory reboot
api.restart_space(repo_id=r, token=t, factory_reboot=True)
print("SUCCESS: V8.6 DEPLOYED: Added pyproject.toml and reboot triggered.")
