"""
🚀 Visual Agent Builder — FastAPI Backend
==========================================
Entry point for the API server.
Handles CORS, Firebase init, and route registration.
"""

import os
os.environ["OPENBLAS_MAIN_FREE"] = "1"
os.environ["NUMEXPR_MAX_THREADS"] = "8"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# ── Firebase initialization ──
from core.firebase_config import init_firebase
init_firebase()

# ── FastAPI App ──
app = FastAPI(
    title="Visual Agent Builder API",
    description="Backend API for the Visual Agent Builder — n8n-style AI workflow platform",
    version="4.0.0",
)

# ── CORS — Allow React frontend ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──
from routers import auth, projects, chat, ml, admin

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat & Execution"])
app.include_router(ml.router, prefix="/api/ml", tags=["ML Training"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {
        "name": "Visual Agent Builder API",
        "version": "4.0.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok"}
