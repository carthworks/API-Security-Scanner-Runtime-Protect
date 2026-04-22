"""
Real async HTTP load runner using httpx + asyncio.
Collects per-second metrics and streams them via SSE.
"""
from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone
from typing import Callable, Dict, List, Optional
from urllib.parse import urljoin

import httpx

from models.load_models import (
    LoadTestConfig, LoadTestJob, LoadTestMetric, LoadTestSummary,
)


def _percentile(values: List[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_v = sorted(values)
    idx = int(len(sorted_v) * pct / 100)
    return sorted_v[min(idx, len(sorted_v) - 1)]


async def _send_request(
    client: httpx.AsyncClient,
    base_url: str,
    endpoint: Dict,
    auth_headers: Dict[str, str],
) -> tuple[Optional[float], int, bool]:
    """Returns (response_time_ms, status_code, is_error)."""
    url = urljoin(base_url.rstrip("/"), endpoint.get("path", "/"))
    method = endpoint.get("method", "GET").upper()
    body = endpoint.get("body")
    t0 = time.perf_counter()
    try:
        r = await client.request(
            method, url,
            json=body if body else None,
            headers=auth_headers,
        )
        elapsed = (time.perf_counter() - t0) * 1000
        is_error = r.status_code >= 400
        return elapsed, r.status_code, is_error
    except Exception:
        elapsed = (time.perf_counter() - t0) * 1000
        return elapsed, 0, True


async def _worker(
    worker_id: int,
    base_url: str,
    config: LoadTestConfig,
    results: List[tuple],
    stop_event: asyncio.Event,
) -> None:
    endpoints = [ep.model_dump() for ep in config.endpoints]
    ep_count = len(endpoints)
    async with httpx.AsyncClient(timeout=config.request_timeout, verify=config.verify_ssl) as client:
        idx = 0
        while not stop_event.is_set():
            endpoint = endpoints[idx % ep_count]
            result = await _send_request(client, base_url, endpoint, config.auth_headers)
            results.append((time.time(), *result))
            idx += 1
            await asyncio.sleep(0)  # yield to event loop


async def run_load_test(
    job: LoadTestJob,
    config: LoadTestConfig,
    emit: Callable[[LoadTestMetric], None],
) -> None:
    """
    Launches concurrent_users async workers, collects real HTTP metrics,
    emits per-second snapshots via emit(), and builds a final summary.
    """
    stop_event = asyncio.Event()
    raw_results: List[tuple] = []  # (timestamp, resp_ms, status_code, is_error)
    all_tasks: List[asyncio.Task] = []

    start_ts = time.time()
    job.status = "running"

    # ── Ramp-up: launch workers gradually ──────────────────────────────────────
    ramp_step = max(1, config.concurrent_users // max(config.ramp_up_seconds, 1))
    active_users = 0

    async def spawn_workers(target: int) -> None:
        nonlocal active_users
        while active_users < target and not stop_event.is_set():
            batch = min(ramp_step, target - active_users)
            for _ in range(batch):
                t = asyncio.create_task(
                    _worker(active_users, config.target_base_url, config, raw_results, stop_event)
                )
                all_tasks.append(t)
                active_users += 1
            await asyncio.sleep(1)

    ramp_task = asyncio.create_task(spawn_workers(config.concurrent_users))

    # ── Metrics collection: one snapshot per second ───────────────────────────
    deadline = start_ts + config.duration_seconds
    last_snapshot_count = 0

    try:
        while time.time() < deadline:
            await asyncio.sleep(1)
            now = time.time()
            elapsed = now - start_ts

            # Only look at results since last snapshot
            window = raw_results[last_snapshot_count:]
            last_snapshot_count = len(raw_results)

            if not window:
                continue

            resp_times = [r[1] for r in window if r[1] is not None]
            statuses = [r[2] for r in window]
            errors = [r[3] for r in window]
            sc_dist: Dict[str, int] = {}
            for s in statuses:
                key = str(s)
                sc_dist[key] = sc_dist.get(key, 0) + 1

            metric = LoadTestMetric(
                timestamp=now,
                elapsed_seconds=round(elapsed, 1),
                rps=round(len(window) / 1.0, 2),
                p50_ms=round(_percentile(resp_times, 50), 2),
                p95_ms=round(_percentile(resp_times, 95), 2),
                p99_ms=round(_percentile(resp_times, 99), 2),
                min_ms=round(min(resp_times, default=0), 2),
                max_ms=round(max(resp_times, default=0), 2),
                error_rate=round(sum(errors) / len(errors) * 100, 2) if errors else 0.0,
                total_requests=len(raw_results),
                failed_requests=sum(1 for r in raw_results if r[3]),
                active_users=active_users,
                status_codes=sc_dist,
            )
            job.metrics.append(metric)
            emit(metric)

    finally:
        stop_event.set()
        ramp_task.cancel()
        for t in all_tasks:
            t.cancel()
        await asyncio.gather(*all_tasks, return_exceptions=True)

    # ── Build final summary ────────────────────────────────────────────────────
    all_resp = [r[1] for r in raw_results if r[1] is not None]
    all_errors = [r[3] for r in raw_results]
    all_statuses = [r[2] for r in raw_results]
    sc_total: Dict[str, int] = {}
    for s in all_statuses:
        key = str(s)
        sc_total[key] = sc_total.get(key, 0) + 1

    duration = time.time() - start_ts
    total_req = len(raw_results)
    total_fail = sum(1 for e in all_errors if e)
    overall_err = (total_fail / total_req * 100) if total_req else 0
    p95 = _percentile(all_resp, 95)

    if overall_err < 1 and p95 < 500:
        stability = "Stable"
    elif overall_err < 5 and p95 < 1000:
        stability = "Degraded"
    elif overall_err < 20:
        stability = "Unstable"
    else:
        stability = "Critical"

    summary = LoadTestSummary(
        total_requests=total_req,
        total_failures=total_fail,
        avg_rps=round(total_req / duration, 2) if duration else 0,
        peak_rps=max((m.rps for m in job.metrics), default=0),
        avg_response_ms=round(sum(all_resp) / len(all_resp), 2) if all_resp else 0,
        p50_ms=round(_percentile(all_resp, 50), 2),
        p95_ms=round(p95, 2),
        p99_ms=round(_percentile(all_resp, 99), 2),
        max_response_ms=round(max(all_resp, default=0), 2),
        overall_error_rate=round(overall_err, 2),
        status_code_distribution=sc_total,
        stability_rating=stability,
        sla_breach=p95 > 200,
        duration_seconds=round(duration, 1),
    )
    job.summary = summary
    job.status = "complete"
    job.completed_at = datetime.now(timezone.utc).isoformat()
