"""AI router — GET /api/ai/models  |  POST /api/ai/query"""
from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.ai_service import (
    GEMINI_MODELS, list_ollama_models, query_ai, query_ai_json,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])


class AIQueryRequest(BaseModel):
    provider: str  # gemini | ollama | custom
    model: str
    prompt: str
    api_key: Optional[str] = None
    base_url: Optional[str] = "http://localhost:11434"
    json_mode: bool = False


@router.get("/models")
async def get_models(
    provider: str = "ollama",
    base_url: str = "http://localhost:11434",
    api_key: Optional[str] = None,
):
    if provider == "ollama":
        models = await list_ollama_models(base_url)
        return {"provider": "ollama", "models": models, "online": len(models) > 0}
    elif provider == "gemini":
        return {"provider": "gemini", "models": GEMINI_MODELS, "online": bool(api_key)}
    return {"provider": provider, "models": [], "online": False}


@router.post("/query")
async def query(req: AIQueryRequest):
    try:
        if req.json_mode:
            result = await query_ai_json(req.provider, req.model, req.prompt, req.api_key, req.base_url)
            return {"result": result}
        result = await query_ai(req.provider, req.model, req.prompt, req.api_key, req.base_url)
        return {"result": result}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
