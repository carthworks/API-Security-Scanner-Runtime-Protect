from __future__ import annotations
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel


class ReportType(str, Enum):
    VAPT = "vapt"
    EXECUTIVE = "executive"
    LOAD_TEST = "load_test"
    ATTESTATION = "attestation"


class VulnReportEntry(BaseModel):
    id: str
    type: str
    owasp_id: str
    severity: str
    status: str
    endpoint_method: str
    endpoint_path: str
    description: str
    details: str
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
    remediation: Optional[str] = None
    poc: Optional[str] = None
    discovered_at: str
    revalidation_status: Optional[str] = None


class EngagementMeta(BaseModel):
    client_name: str = "Client Organisation"
    project_name: str = "API Security Assessment"
    assessment_date: str
    report_date: str
    tester_name: str = "Sentinel Security Team"
    engagement_scope: str = "25 API Endpoints"
    environment: str = "Staging"
    standards: List[str] = [
        "OWASP API Security Top 10 (2023)",
        "CERT-In Guidelines",
        "ISO/IEC 27001:2022",
        "NIST SP 800-115",
        "CVSS v3.1",
    ]


class VaptReportRequest(BaseModel):
    report_type: ReportType
    engagement: EngagementMeta
    vulnerabilities: List[VulnReportEntry] = []
    load_test_summary: Optional[Dict[str, Any]] = None
    load_test_metrics: Optional[List[Dict[str, Any]]] = None
    executive_summary: Optional[str] = None
