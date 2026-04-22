"""Scan router — POST /api/scan  |  GET /api/scan/{job_id}/stream  |  GET /api/scan/{job_id}"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from models.scan_models import ScanJob, ScanProgress, ScanRequest, ScanResponse
from services.scanner import run_scan

router = APIRouter(prefix="/api/scan", tags=["Scan"])

# In-memory job store (keyed by job_id)
_jobs: Dict[str, ScanJob] = {}


def _emit(job: ScanJob) -> callable:
    def _inner(progress: ScanProgress) -> None:
        job.progress = progress
    return _inner


@router.post("", response_model=ScanResponse)
async def start_scan(req: ScanRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    job = ScanJob(
        job_id=job_id,
        name=req.name,
        status="running",
        started_at=datetime.now(timezone.utc).isoformat(),
    )
    _jobs[job_id] = job
    background_tasks.add_task(run_scan, job, req, _emit(job))
    return ScanResponse(job_id=job_id, message="Scan started")


@router.get("/{job_id}")
async def get_scan(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.model_dump()


@router.get("/{job_id}/stream")
async def stream_scan(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_gen():
        while True:
            payload = {
                "progress": job.progress.model_dump(),
                "status": job.status,
                "findings_count": len(job.findings),
                "endpoints_tested": job.endpoints_tested,
            }
            yield f"data: {json.dumps(payload)}\n\n"
            if job.status in ("complete", "failed"):
                # Send final payload with all findings
                final = job.model_dump()
                yield f"data: {json.dumps({'final': True, 'job': final})}\n\n"
                break
            await asyncio.sleep(0.75)

    return StreamingResponse(event_gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.delete("/{job_id}")
async def delete_scan(job_id: str):
    _jobs.pop(job_id, None)
    return {"message": "Job deleted"}
