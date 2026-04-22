from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LoadTestEndpoint(BaseModel):
    method: str = "GET"
    path: str
    body: Optional[Dict[str, Any]] = None
    expected_status: int = 200


class LoadTestConfig(BaseModel):
    target_base_url: str
    endpoints: List[LoadTestEndpoint]
    concurrent_users: int = Field(default=10, ge=1, le=1000)
    duration_seconds: int = Field(default=60, ge=10, le=1800)
    ramp_up_seconds: int = Field(default=10, ge=0)
    auth_headers: Dict[str, str] = Field(default_factory=dict)
    request_timeout: float = 10.0
    verify_ssl: bool = False


class LoadTestMetric(BaseModel):
    timestamp: float
    elapsed_seconds: float
    rps: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    min_ms: float
    max_ms: float
    error_rate: float
    total_requests: int
    failed_requests: int
    active_users: int
    status_codes: Dict[str, int] = Field(default_factory=dict)


class LoadTestSummary(BaseModel):
    total_requests: int
    total_failures: int
    avg_rps: float
    peak_rps: float
    avg_response_ms: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    max_response_ms: float
    overall_error_rate: float
    status_code_distribution: Dict[str, int]
    stability_rating: str   # Stable / Degraded / Unstable / Critical
    sla_breach: bool        # p95 > 200ms threshold
    duration_seconds: float


class LoadTestJob(BaseModel):
    job_id: str
    status: str  # pending, running, complete, failed
    config: LoadTestConfig
    metrics: List[LoadTestMetric] = []
    summary: Optional[LoadTestSummary] = None
    started_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
