# SARVAM API Gateway (Multi-mode Entry Point)
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import traceback
import uvicorn

# We use absolute imports relative to the package root
from server.database.core import create_tables, get_db, Base, engine
from server.api.routes import auth, ai_services, career, dashboard, env, openenv
from server.api.routes import history as history_route
import server.database.temporal_anchor  # noqa: F401 — registers models with SQLAlchemy
from server.services.socket_manager import manager
from server.services.analytics import get_live_metrics

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
app.include_router(env.router,                tags=["SARVAM OpenEnv Root Alias"])
app.include_router(openenv.router,           prefix="/openenv",      tags=["SARVAM OpenEnv OpenAI Alias"])
app.include_router(history_route.router)

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
try:
    # Look for dist relative to the server folder
    dist_path = os.path.join(os.path.dirname(__file__), "dist")
    if not os.path.exists(dist_path):
        dist_path = "dist" # Fallback to current working directory
        
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")

    @app.exception_handler(404)
    async def not_found_exception_handler(request, exc):
        if request.url.path.startswith("/api"):
            return JSONResponse(
                status_code=404,
                content={"detail": "API route not found", "path": request.url.path}
            )
        return FileResponse(os.path.join(dist_path, "index.html"))

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        print(f"❌ CRASH: {request.url.path} - {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error",
                "error": str(exc),
                "path": request.url.path,
                "traceback": traceback.format_exc()
            }
        )
except Exception as e:
    print(f"⚠️ Static content mount skipped: {e}")

def main():
    """Main function required by the OpenEnv validator."""
    uvicorn.run(app, host="0.0.0.0", port=7860, reload=False)

if __name__ == "__main__":
    main()
