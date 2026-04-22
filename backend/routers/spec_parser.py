"""Spec parser router — POST /api/spec/parse"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import yaml
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter(prefix="/api/spec", tags=["Spec Parser"])


class ParsedEndpoint(BaseModel):
    method: str
    path: str
    description: Optional[str] = None
    parameters: Optional[List[Dict[str, Any]]] = None
    request_body: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None


def _parse_openapi(spec: Dict) -> List[ParsedEndpoint]:
    endpoints: List[ParsedEndpoint] = []
    paths = spec.get("paths", {})
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, op in methods.items():
            if method.lower() in ("get", "post", "put", "delete", "patch", "options"):
                if not isinstance(op, dict):
                    continue
                endpoints.append(ParsedEndpoint(
                    method=method.upper(),
                    path=path,
                    description=op.get("summary") or op.get("description", ""),
                    parameters=op.get("parameters"),
                    request_body=op.get("requestBody"),
                    tags=op.get("tags"),
                ))
    return endpoints


def _parse_postman(collection: Dict) -> List[ParsedEndpoint]:
    endpoints: List[ParsedEndpoint] = []

    def _walk(items: List) -> None:
        for item in items:
            if "item" in item:
                _walk(item["item"])
            elif "request" in item:
                req = item["request"]
                raw_url = req.get("url", {})
                if isinstance(raw_url, str):
                    path = "/" + raw_url.split("/", 3)[-1] if "/" in raw_url else raw_url
                else:
                    path = "/" + "/".join(raw_url.get("path", []))
                method = req.get("method", "GET").upper()
                endpoints.append(ParsedEndpoint(
                    method=method,
                    path=path,
                    description=item.get("name", ""),
                ))

    _walk(collection.get("item", []))
    return endpoints


@router.post("/parse", response_model=List[ParsedEndpoint])
async def parse_spec(file: UploadFile = File(...)):
    """
    Accepts OpenAPI 2/3 (JSON or YAML) or Postman Collection v2.x JSON.
    Returns a flat list of endpoint definitions.
    """
    content = await file.read()
    filename = file.filename or ""

    try:
        if filename.endswith((".yaml", ".yml")):
            spec = yaml.safe_load(content)
        else:
            spec = json.loads(content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {exc}")

    # Detect format
    if "openapi" in spec or "swagger" in spec:
        return _parse_openapi(spec)
    elif "info" in spec and "item" in spec:
        return _parse_postman(spec)
    else:
        raise HTTPException(status_code=422, detail="Unrecognised spec format. Provide OpenAPI or Postman Collection.")
