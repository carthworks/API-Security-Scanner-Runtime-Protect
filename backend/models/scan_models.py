from __future__ import annotations
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class ScanSource(str, Enum):
    URL = "url"
    SPEC = "spec"


class ScanDepth(str, Enum):
    QUICK = "Quick"
    NORMAL = "Normal"
    DEEP = "Deep"


class OWASPCategory(str, Enum):
    API1 = "API1:2023"
    API2 = "API2:2023"
    API3 = "API3:2023"
    API4 = "API4:2023"
    API5 = "API5:2023"
    API6 = "API6:2023"
    API7 = "API7:2023"
    API8 = "API8:2023"
    API9 = "API9:2023"
    API10 = "API10:2023"


class AIProvider(str, Enum):
    GEMINI = "gemini"
    OLLAMA = "ollama"
    CUSTOM = "custom"


class EndpointDef(BaseModel):
    method: str
    path: str
    description: Optional[str] = None
    parameters: Optional[List[Dict[str, Any]]] = None


class ScanRequest(BaseModel):
    name: str
    target_url: str
    source_type: ScanSource = ScanSource.URL
    endpoints: Optional[List[EndpointDef]] = None  # from spec parse
    owasp_categories: List[str] = Field(
        default_factory=lambda: [c.value for c in OWASPCategory]
    )
    scan_depth: ScanDepth = ScanDepth.NORMAL
    auth_token: Optional[str] = None
    auth_header_name: str = "Authorization"
    ai_provider: AIProvider = AIProvider.OLLAMA
    ai_model: str = "llama2"
    ai_api_key: Optional[str] = None
    ai_base_url: str = "http://localhost:11434"


class CvssMetrics(BaseModel):
    AV: str  # Network(N), Adjacent(A), Local(L), Physical(P)
    AC: str  # Low(L), High(H)
    PR: str  # None(N), Low(L), High(H)
    UI: str  # None(N), Required(R)
    S: str   # Unchanged(U), Changed(C)
    C: str   # None(N), Low(L), High(H)
    I: str   # None(N), Low(L), High(H)
    A: str   # None(N), Low(L), High(H)


class CvssScore(BaseModel):
    score: float
    vector: str
    metrics: CvssMetrics


class ScanFinding(BaseModel):
    type: str
    owasp_id: str
    severity: str  # Critical, High, Medium, Low, Info
    endpoint: Dict[str, str]  # {method, path}
    description: str
    details: str
    cvss: Optional[CvssScore] = None
    evidence: Optional[str] = None
    poc: Optional[str] = None
    remediation_hint: Optional[str] = None


class ScanProgress(BaseModel):
    phase: str  # connecting, probing, analysing, ai_analysis, complete, failed
    message: str
    percent: int = 0
    found: int = 0
    current_check: Optional[str] = None


class ScanJob(BaseModel):
    job_id: str
    name: str
    status: str  # pending, running, complete, failed
    progress: ScanProgress = Field(
        default_factory=lambda: ScanProgress(phase="pending", message="Queued", percent=0)
    )
    findings: List[ScanFinding] = []
    endpoints_tested: int = 0
    started_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None


class ScanResponse(BaseModel):
    job_id: str
    message: str
