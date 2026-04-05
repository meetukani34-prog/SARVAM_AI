from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from database.core import create_tables, get_db, Base, engine
from api.routes import auth, ai_services, career, dashboard, env
from api.routes import history as history_route
import database.temporal_anchor  # noqa: F401 — registers models with SQLAlchemy
from services.socket_manager import manager
from services.analytics import get_live_metrics

app = FastAPI(
    title="SARVAM API",
    description="Backend for the SARVAM Career Development Platform",
    version="1.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()           # Existing tables
    Base.metadata.create_all(bind=engine)  # Temporal Anchor tables
    print("✅ SARVAM API — Consolidated Core + Temporal Anchor initialized")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,               prefix="/api/auth",      tags=["Authentication"])
app.include_router(ai_services.router,        prefix="/api",           tags=["AI Cognitive Services"])
app.include_router(career.router,             prefix="/api",           tags=["Career Growth Engine"])
app.include_router(dashboard.router,          prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(env.router,                prefix="/api/env",       tags=["SARVAM OpenEnv"])
app.include_router(history_route.router)  # Temporal Anchor — /api/history/*

# ── WebSockets ────────────────────────────────────────────────────────────────
@app.websocket("/ws/analytics/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        db_gen = get_db()
        db = next(db_gen)
        metrics = get_live_metrics(user_id, db)
        await websocket.send_json(metrics)
        while True: await websocket.receive_text()
    except Exception: manager.disconnect(websocket, user_id)

@app.get("/api/health", tags=["Health"])
def health_check(): return {"status": "ok"}

# ── Static Files (Frontend) ────────────────────────────────────────────────────
# This should be at the very bottom so it doesn't conflict with API routes
try:
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

    # Catch-all for SPA (Single Page Application)
    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        return FileResponse("dist/index.html")
except Exception as e:
    print(f"⚠️ Static content mount skipped: {e}")
