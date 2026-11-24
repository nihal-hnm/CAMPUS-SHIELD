"""
CampusShield FastAPI application entry point.

Zero-Trust Campus Document Security & Academic Integrity Platform
NexHack 2.0 — PS 07
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth, documents, access, audit

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CampusShield API",
    version="2.0.0",
    description=(
        "Zero-Trust Campus Document Security & Academic Integrity Platform. "
        "Every document request passes through a 10-step verification pipeline. "
        "AI is NEVER involved in authorization decisions."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["auth"])
app.include_router(documents.router, prefix="/api/v1/documents",  tags=["documents"])
app.include_router(access.router,    prefix="/api/v1/access",     tags=["access"])
app.include_router(audit.router,     prefix="/api/v1/audit",      tags=["audit"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "version": "2.0.0", "service": "CampusShield API"}


@app.get("/", tags=["system"])
async def root():
    return {
        "service": "CampusShield API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
    }
