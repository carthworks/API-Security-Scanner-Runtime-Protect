"""
Unified AI service — dispatches to Gemini, Ollama, or custom OpenAI-compatible endpoint.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger(__name__)

# ─── Gemini ───────────────────────────────────────────────────────────────────

async def _query_gemini(model: str, prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096},
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


# ─── Ollama ───────────────────────────────────────────────────────────────────

async def _query_ollama(model: str, prompt: str, base_url: str, json_mode: bool = False) -> str:
    payload: Dict[str, Any] = {"model": model, "prompt": prompt, "stream": False}
    if json_mode:
        payload["format"] = "json"
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(f"{base_url.rstrip('/')}/api/generate", json=payload)
        resp.raise_for_status()
        return resp.json()["response"]


# ─── Custom OpenAI-compatible ─────────────────────────────────────────────────

async def _query_openai_compat(
    model: str, prompt: str, base_url: str, api_key: Optional[str]
) -> str:
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "max_tokens": 4096,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{base_url.rstrip('/')}/v1/chat/completions",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


# ─── Public dispatcher ────────────────────────────────────────────────────────

async def query_ai(
    provider: str,
    model: str,
    prompt: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = "http://localhost:11434",
    json_mode: bool = False,
) -> str:
    """
    Dispatch an AI prompt to the configured provider.
    Raises on failure — callers should catch and handle gracefully.
    """
    provider = provider.lower()
    if provider == "gemini":
        if not api_key:
            raise ValueError("Gemini API key is required")
        return await _query_gemini(model, prompt, api_key)
    elif provider == "ollama":
        _base = base_url or "http://localhost:11434"
        return await _query_ollama(model, prompt, _base, json_mode)
    elif provider == "custom":
        _base = base_url or ""
        if not _base:
            raise ValueError("Custom AI base URL is required")
        return await _query_openai_compat(model, prompt, _base, api_key)
    else:
        raise ValueError(f"Unknown AI provider: {provider}")


async def query_ai_json(
    provider: str,
    model: str,
    prompt: str,
    api_key: Optional[str] = None,
    base_url: Optional[str] = "http://localhost:11434",
) -> Any:
    """Query AI and parse the response as JSON. Strips markdown fences if present."""
    raw = await query_ai(provider, model, prompt, api_key, base_url, json_mode=(provider == "ollama"))
    cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
    # Try to extract embedded JSON if wrapped in prose
    if not cleaned.startswith("[") and not cleaned.startswith("{"):
        import re
        match = re.search(r"(\[[\s\S]*\]|\{[\s\S]*\})", cleaned)
        if match:
            cleaned = match.group(1)
    return json.loads(cleaned)


# ─── Model listing ────────────────────────────────────────────────────────────

async def list_ollama_models(base_url: str = "http://localhost:11434") -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{base_url.rstrip('/')}/api/tags")
            resp.raise_for_status()
            return [m["name"] for m in resp.json().get("models", [])]
    except Exception as exc:
        logger.warning("Ollama not reachable: %s", exc)
        return []


GEMINI_MODELS = [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
]
