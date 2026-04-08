# SARVAM API Gateway
# Last Heartbeat: 2026-04-06T21:45:00Z
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from database.core import create_tables, get_db, Base, engine
from api.routes import auth, ai_services, career, dashboard, env, openenv
from api.routes import history as history_route
import database.temporal_anchor  # noqa: F401 — registers models with SQLAlchemy
import traceback
from services.socket_manager import manager
from services.analytics import get_live_metrics
import uvicorn

app = FastAPI(
    title="SARVAM API",
    description="Backend for the SARVAM Career Development Platform",
    version="1.2.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    redirect_slashes=True,
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
app.include_router(ai_services.router,        prefix="/api/ai",        tags=["AI Cognitive Services"])
app.include_router(career.router,             prefix="/api/career",    tags=["Career Growth Engine"])
app.include_router(dashboard.router,          prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(env.router,                prefix="/api/env",       tags=["SARVAM OpenEnv"])
app.include_router(env.router,                tags=["SARVAM OpenEnv Root Alias"])  # Added to fix /reset 405 error
app.include_router(openenv.router,           prefix="/openenv",      tags=["SARVAM OpenEnv OpenAI Alias"])  # Dedicated OpenEnv router
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

@app.get("/api/diagnostics", tags=["Health"])
def get_diagnostics(db: Session = Depends(get_db)):
    """Advanced system diagnostics to verify database integrity and registered routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append(f"{list(route.methods)} {route.path}")
            
    try:
        tables = {}
        for table_name in Base.metadata.tables.keys():
            count = db.execute(text(f"SELECT COUNT(*) FROM {table_name}")).scalar()
            tables[table_name] = count
        return {
            "VERSION": "1.2.1-DEBUG-ROUTING",
            "STATUS": "OK",
            "DATABASE_CONNECTED": True,
            "DATABASE_TABLES": tables,
            "NVIDIA_API_KEY_EXISTS": bool(os.getenv("NVIDIA_API_KEY")),
            "REGISTERED_ROUTES": routes,
            "CWD": os.getcwd(),
            "FILES": os.listdir(".")
        }
    except Exception as e:
        return {"STATUS": "ERROR", "ERROR": str(e)}

# ── Static Files (Frontend) ────────────────────────────────────────────────────
# This should be at the very bottom so it doesn't conflict with API routes
try:
    app.mount("/", StaticFiles(directory="dist", html=True), name="static")

    # Catch-all for SPA (Single Page Application)
    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        if request.url.path.startswith("/api"):
            return JSONResponse(
                status_code=404,
                content={"detail": "API route not found", "path": request.url.path}
            )
        return FileResponse("dist/index.html")

    # Global DEBUG Exception Handler (Temporary)
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        print(f"❌ CRASH: {request.url.path} - {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error (Captured by Global Handler)",
                "error": str(exc),
                "path": request.url.path,
                "traceback": traceback.format_exc()
            }
        )
except Exception as e:
    print(f"⚠️ Static content mount skipped: {e}")

def start():
    """Entry point for the 'server' command."""
    uvicorn.run("api.main:app", host="0.0.0.0", port=7860, reload=False)

if __name__ == "__main__":
    start()
