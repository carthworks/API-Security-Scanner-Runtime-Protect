"""FastAPI application entry point."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import ai, load_test, reports, scan, spec_parser

load_dotenv()

# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🛡  Sentinel API Backend starting…")
    yield
    print("🛡  Sentinel API Backend shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Sentinel API — Security Assessment Backend",
    description=(
        "FastAPI backend powering the Sentinel API Security Scanner. "
        "Provides real VAPT scanning, load testing, PDF report generation, "
        "and a unified AI proxy (Gemini / Ollama / custom)."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174")
origins = [o.strip() for o in _origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(scan.router)
app.include_router(load_test.router)
app.include_router(reports.router)
app.include_router(ai.router)
app.include_router(spec_parser.router)


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "sentinel-api-backend", "version": "1.0.0"}


# ─── Dev entrypoint ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=True,
    )
