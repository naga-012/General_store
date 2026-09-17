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
    path = request.url.path
    if path.startswith("/api") and path != "/api/health":
        # Ensure database is reachable
        db_ok = await check_db_connection()
        if not db_ok:
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "message": "Database is not connected. Please verify that MONGODB_URI is set in Render environment variables and that MongoDB Atlas allows access from 0.0.0.0/0."
                }
            )
    response = await call_next(request)
    return response

# Health check route
@app.get("/api/health")
async def health_check():
    db_ok = await check_db_connection()
    status_text = "healthy" if db_ok else "degraded"
    db_status = "connected" if db_ok else "disconnected"
    return {
        "status": status_text,
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

# Root route
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Manikanta Supermarket Backend (Python / FastAPI)",
        "docs": "/docs"
    }

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
