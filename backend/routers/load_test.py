"""Load test router — POST /api/load-test  |  GET /api/load-test/{job_id}/stream"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse

from models.load_models import LoadTestConfig, LoadTestJob, LoadTestMetric
from services.load_runner import run_load_test

router = APIRouter(prefix="/api/load-test", tags=["Load Test"])

_jobs: Dict[str, LoadTestJob] = {}


def _emit(job: LoadTestJob) -> callable:
    def _inner(metric: LoadTestMetric) -> None:
        pass  # metrics already appended inside run_load_test
    return _inner


@router.post("")
async def start_load_test(config: LoadTestConfig, background_tasks: BackgroundTasks):
    if not config.endpoints:
        raise HTTPException(status_code=422, detail="At least one endpoint is required")
    job_id = str(uuid.uuid4())
    job = LoadTestJob(
        job_id=job_id,
        status="running",
        config=config,
        started_at=datetime.now(timezone.utc).isoformat(),
    )
    _jobs[job_id] = job
    background_tasks.add_task(run_load_test, job, config, _emit(job))
    return {"job_id": job_id, "message": "Load test started"}


@router.get("/{job_id}")
async def get_load_test(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.model_dump()


@router.get("/{job_id}/stream")
async def stream_load_test(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    last_sent = 0

    async def event_gen():
        nonlocal last_sent
        while True:
            new_metrics = job.metrics[last_sent:]
            if new_metrics:
                for metric in new_metrics:
                    yield f"data: {json.dumps({'type': 'metric', 'data': metric.model_dump()})}\n\n"
                last_sent = len(job.metrics)

            if job.status in ("complete", "failed"):
                final = job.model_dump()
                yield f"data: {json.dumps({'type': 'complete', 'job': final})}\n\n"
                break
            await asyncio.sleep(1)

    return StreamingResponse(event_gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
