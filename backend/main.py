import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import socketio

from config.database import check_db_connection, get_db
from services.socket_service import sio
from routers import auth, products, categories, orders, notifications, admin

app = FastAPI(
    title="Manikanta Supermarket API",
    description="Backend API for Supermarket Counter Ordering and Store Management",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static uploads directory
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Fast diagnostic DB check middleware for API requests
@app.middleware("http")
async def db_connectivity_middleware(request: Request, call_next):
    if request.method in ("HEAD", "OPTIONS"):
        return await call_next(request)
    path = request.url.path
    if path.startswith("/api") and path not in ("/api/health", "/api/health/db"):
        # Ensure database is reachable
        db_ok, msg = await check_db_connection()
        if not db_ok:
            origin = request.headers.get("origin", "*")
            return JSONResponse(
                status_code=503,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Credentials": "true",
                },
                content={
                    "success": False,
                    "message": f"Database is not connected ({msg}). Please verify MONGODB_URI in Render environment variables."
                }
            )
    response = await call_next(request)
    return response

# Health check route (instant response for deployment probes)
@app.api_route("/api/health", methods=["GET", "HEAD"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# Diagnostic DB health check route
@app.api_route("/api/health/db", methods=["GET", "HEAD"])
async def health_db_check():
    db_ok, msg = await check_db_connection()
    status_text = "healthy" if db_ok else "degraded"
    db_status = "connected" if db_ok else "disconnected"
    uri_env = os.getenv("MONGODB_URI", "")
    # Mask password for security
    masked_uri = "NOT_SET"
    if uri_env:
        masked_uri = uri_env[:15] + "..." + uri_env[-10:] if len(uri_env) > 25 else "SET_SHORT"
    return {
        "status": status_text,
        "database": db_status,
        "mongodb_env_configured": bool(uri_env),
        "mongodb_uri_preview": masked_uri,
        "diagnostic_detail": msg,
        "timestamp": datetime.utcnow().isoformat()
    }

# Root route
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    return {
        "status": "online",
        "service": "Manikanta Supermarket Backend (Python / FastAPI)",
        "docs": "/docs"
    }

from utils.seeder import auto_seed_catalog

@app.on_event("startup")
async def startup_event():
    try:
        db_ok, _ = await check_db_connection()
        if db_ok:
            await auto_seed_catalog()
    except Exception as e:
        print(f"Startup auto-seed warning: {e}")

# Seed catalog endpoint (can be triggered anytime to populate products)
@app.api_route("/api/admin/seed-catalog", methods=["GET", "POST"])
async def seed_catalog_endpoint():
    res = await auto_seed_catalog()
    return res

# Include API Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(notifications.router)
app.include_router(admin.router)

# Mount Socket.IO with FastAPI as a single unified ASGI application
application = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app,
    socketio_path="/socket.io"
)

# For running via `uvicorn main:app` or `uvicorn main:application`
# In ASGI mode, Socket.IO wrapper handles incoming websocket & HTTP
app_runner = application

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:application", host="0.0.0.0", port=port, reload=True)
