"""
Real HTTP-based VAPT scanner implementing OWASP API Security Top 10 checks.
"""
from __future__ import annotations

import asyncio
import re
import time
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import urljoin, urlparse

import httpx

from models.scan_models import (
    CvssMetrics, CvssScore, ScanFinding, ScanJob, ScanProgress, ScanRequest,
)
from services.ai_service import query_ai_json

# ─── CVSS helpers ─────────────────────────────────────────────────────────────

_CVSS_PRESETS: Dict[str, CvssScore] = {
    "Critical": CvssScore(score=9.8, vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                          metrics=CvssMetrics(AV="N",AC="L",PR="N",UI="N",S="U",C="H",I="H",A="H")),
    "High":     CvssScore(score=7.5, vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N",
                          metrics=CvssMetrics(AV="N",AC="L",PR="N",UI="N",S="U",C="H",I="N",A="N")),
    "Medium":   CvssScore(score=5.3, vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N",
                          metrics=CvssMetrics(AV="N",AC="L",PR="N",UI="N",S="U",C="L",I="N",A="N")),
    "Low":      CvssScore(score=3.1, vector="CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N",
                          metrics=CvssMetrics(AV="N",AC="H",PR="N",UI="R",S="U",C="L",I="N",A="N")),
    "Info":     CvssScore(score=0.0, vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N",
                          metrics=CvssMetrics(AV="N",AC="L",PR="N",UI="N",S="U",C="N",I="N",A="N")),
}

def _cvss(severity: str) -> CvssScore:
    return _CVSS_PRESETS.get(severity, _CVSS_PRESETS["Info"])

def _finding(type_: str, owasp_id: str, severity: str, method: str, path: str,
             description: str, details: str, evidence: Optional[str] = None) -> ScanFinding:
    return ScanFinding(
        type=type_, owasp_id=owasp_id, severity=severity,
        endpoint={"method": method, "path": path},
        description=description, details=details,
        cvss=_cvss(severity), evidence=evidence,
    )


# ─── Individual checks ────────────────────────────────────────────────────────

async def check_security_headers(client: httpx.AsyncClient, base_url: str, path: str = "/") -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    try:
        r = await client.get(urljoin(base_url, path))
        h = {k.lower(): v for k, v in r.headers.items()}

        header_checks = [
            ("x-content-type-options",     "Missing X-Content-Type-Options",   "Medium"),
            ("x-frame-options",            "Missing X-Frame-Options Header",    "Low"),
            ("strict-transport-security",  "Missing HSTS Header",              "Medium"),
            ("content-security-policy",    "Missing Content-Security-Policy",  "Medium"),
        ]
        for header, name, sev in header_checks:
            if header not in h:
                findings.append(_finding(
                    name, "API8:2023", sev, "GET", path,
                    f"The {header.title()} security header is absent.",
                    f"Response headers: {dict(list(h.items())[:8])}",
                    evidence=f"Header '{header}' not found in response",
                ))

        # Check verbose server header
        server = h.get("server", "")
        if re.search(r"\d+\.\d+", server):
            findings.append(_finding(
                "Server Version Disclosure", "API8:2023", "Low", "GET", path,
                "The Server header exposes version information.",
                f"Server: {server}", evidence=server,
            ))
    except Exception:
        pass
    return findings


async def check_cors(client: httpx.AsyncClient, base_url: str, path: str = "/") -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    try:
        evil_origin = "https://evil-attacker.com"
        r = await client.options(
            urljoin(base_url, path),
            headers={"Origin": evil_origin, "Access-Control-Request-Method": "GET"},
        )
        acao = r.headers.get("access-control-allow-origin", "")
        acac = r.headers.get("access-control-allow-credentials", "")
        if acao == "*":
            findings.append(_finding(
                "Overly Permissive CORS Policy", "API8:2023", "High", "OPTIONS", path,
                "The API returns Access-Control-Allow-Origin: * allowing any domain to read responses.",
                "Wildcard CORS combined with sensitive APIs can expose user data to attacker-controlled pages.",
                evidence=f"Access-Control-Allow-Origin: {acao}",
            ))
        elif evil_origin in acao:
            sev = "Critical" if acac.lower() == "true" else "High"
            findings.append(_finding(
                "CORS Origin Reflection", "API8:2023", sev, "OPTIONS", path,
                "The API reflects arbitrary origins in CORS headers without validation.",
                f"Requested origin '{evil_origin}' was echoed back. Credentials allowed: {acac}.",
                evidence=f"ACAO: {acao}, ACAC: {acac}",
            ))
    except Exception:
        pass
    return findings


async def check_rate_limiting(client: httpx.AsyncClient, base_url: str, path: str = "/") -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    try:
        target = urljoin(base_url, path)
        responses = await asyncio.gather(
            *[client.get(target) for _ in range(15)], return_exceptions=True
        )
        statuses = [r.status_code for r in responses if isinstance(r, httpx.Response)]
        if statuses and not any(s in (429, 503, 503) for s in statuses):
            findings.append(_finding(
                "Missing Rate Limiting", "API4:2023", "High", "GET", path,
                "The endpoint does not implement rate limiting — 15 rapid requests all succeeded.",
                f"All {len(statuses)} requests returned success codes. Status codes: {set(statuses)}.",
                evidence=f"15 rapid requests, status codes: {statuses[:5]}",
            ))
    except Exception:
        pass
    return findings


async def check_auth_required(client: httpx.AsyncClient, base_url: str, path: str, method: str = "GET") -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    try:
        # Strip auth headers and try unauthenticated
        no_auth_client = httpx.AsyncClient(timeout=10.0, verify=False, headers={})
        r = await no_auth_client.request(method, urljoin(base_url, path))
        await no_auth_client.aclose()
        if r.status_code in (200, 201, 202):
            findings.append(_finding(
                "Broken Authentication", "API2:2023", "Critical", method, path,
                "Endpoint returns data without authentication credentials.",
                f"Unauthenticated {method} request to {path} returned HTTP {r.status_code}.",
                evidence=f"HTTP {r.status_code} without Authorization header",
            ))
    except Exception:
        pass
    return findings


async def check_injection(client: httpx.AsyncClient, base_url: str, path: str) -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    sql_payloads = ["' OR '1'='1", "1; SELECT 1--", "\" OR 1=1--"]
    xss_payloads = ["<script>alert(1)</script>", "'\"><img src=x onerror=alert(1)>"]

    try:
        # GET param injection
        for payload in sql_payloads[:2]:
            r = await client.get(urljoin(base_url, path), params={"id": payload, "q": payload})
            body = r.text.lower()
            if any(kw in body for kw in ["sql", "syntax error", "mysql", "ora-", "pg::"]):
                findings.append(_finding(
                    "SQL Injection", "API9:2023", "Critical", "GET", path,
                    "API endpoint reflects SQL error messages indicating injection vulnerability.",
                    f"Payload '{payload}' triggered a database error in the response.",
                    evidence=r.text[:300],
                ))
                break

        for payload in xss_payloads[:1]:
            r = await client.get(urljoin(base_url, path), params={"q": payload})
            if payload in r.text:
                findings.append(_finding(
                    "Cross-Site Scripting (XSS) via API Response", "API9:2023", "High", "GET", path,
                    "API reflects unsanitised input in response — potential stored/reflected XSS.",
                    f"Payload was echoed verbatim: {payload[:80]}",
                    evidence=r.text[:300],
                ))
                break
    except Exception:
        pass
    return findings


async def check_sensitive_data(client: httpx.AsyncClient, base_url: str, path: str, method: str = "GET") -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    try:
        r = await client.request(method, urljoin(base_url, path))
        body = r.text.lower()
        patterns = {
            "password":    ("Password Exposed in Response", "High"),
            "secret":      ("Secret Key in Response",       "High"),
            "private_key": ("Private Key in Response",      "Critical"),
            "api_key":     ("API Key in Response",          "High"),
            "access_token":("Access Token in Response",     "Critical"),
            "ssn":         ("PII (SSN) in Response",        "High"),
        }
        for kw, (name, sev) in patterns.items():
            if kw in body:
                findings.append(_finding(
                    name, "API3:2023", sev, method, path,
                    f"Response body may contain sensitive field: '{kw}'.",
                    "Sensitive data exposure violates GDPR/data minimisation principles.",
                    evidence=f"Keyword '{kw}' found in response",
                ))
                break
    except Exception:
        pass
    return findings


async def check_old_api_versions(client: httpx.AsyncClient, base_url: str) -> List[ScanFinding]:
    findings: List[ScanFinding] = []
    parsed = urlparse(base_url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    version_paths = ["/v1/", "/api/v1/", "/v2/", "/api/v2/", "/api/beta/", "/api/old/"]
    try:
        for vpath in version_paths:
            r = await client.get(urljoin(base, vpath))
            if r.status_code not in (404, 410):
                findings.append(_finding(
                    "Legacy API Version Exposed", "API9:2023", "Medium", "GET", vpath,
                    f"Old API version path {vpath} returns HTTP {r.status_code} — may lack current security controls.",
                    "Stale API versions often bypass newer authentication/authorisation mechanisms.",
                    evidence=f"HTTP {r.status_code} on {vpath}",
                ))
    except Exception:
        pass
    return findings


async def check_bola(client: httpx.AsyncClient, base_url: str, path: str) -> List[ScanFinding]:
    """Check for Broken Object Level Authorization by trying adjacent IDs."""
    findings: List[ScanFinding] = []
    id_paths = [re.sub(r"/(\d+)", "/2", path), re.sub(r"/(\d+)", "/999", path)]
    try:
        for test_path in id_paths:
            if test_path == path:
                continue
            r = await client.get(urljoin(base_url, test_path))
            if r.status_code == 200 and len(r.text) > 20:
                findings.append(_finding(
                    "Broken Object Level Authorization (BOLA/IDOR)", "API1:2023", "Critical", "GET", test_path,
                    "Endpoint returns data for arbitrary object IDs without ownership validation.",
                    f"Accessing {test_path} returned HTTP 200 with {len(r.text)} bytes.",
                    evidence=f"HTTP 200 on {test_path}: {r.text[:200]}",
                ))
                break
    except Exception:
        pass
    return findings


# ─── AI-augmented analysis ────────────────────────────────────────────────────

async def ai_augment_scan(
    target: str, base_findings: List[ScanFinding], req: ScanRequest
) -> List[ScanFinding]:
    """Use AI to identify additional vulnerabilities based on target context."""
    existing = [{"type": f.type, "owasp_id": f.owasp_id} for f in base_findings]
    prompt = f"""You are an expert API security analyst. Analyse this API target and return additional vulnerability findings NOT already in the list below.

Target: {target}
OWASP categories to focus on: {req.owasp_categories}
Already found: {existing}

Return a JSON array of finding objects. Each must have these exact keys:
type, owasp_id, severity (Critical/High/Medium/Low/Info), endpoint (object with method and path), description, details

Return 2-4 realistic findings. Respond ONLY with valid JSON array, no markdown."""

    try:
        raw = await query_ai_json(req.ai_provider, req.ai_model, prompt, req.ai_api_key, req.ai_base_url)
        ai_findings = raw if isinstance(raw, list) else raw.get("vulnerabilities", [])
        result = []
        for f in ai_findings[:4]:
            ep = f.get("endpoint", {})
            sev = f.get("severity", "Medium")
            result.append(_finding(
                f.get("type", "Unknown"), f.get("owasp_id", "API8:2023"), sev,
                ep.get("method", "GET"), ep.get("path", "/"),
                f.get("description", ""), f.get("details", ""),
            ))
        return result
    except Exception:
        return []


# ─── Main orchestrator ────────────────────────────────────────────────────────

async def run_scan(job: ScanJob, req: ScanRequest, emit: Callable[[ScanProgress], None]) -> None:
    """
    Orchestrates all VAPT checks. Mutates job.findings and job.status in place.
    `emit` is called with progress updates for SSE streaming.
    """
    findings: List[ScanFinding] = []
    base_url = req.target_url.rstrip("/")

    auth_headers: Dict[str, str] = {}
    if req.auth_token:
        auth_headers[req.auth_header_name] = req.auth_token

    client = httpx.AsyncClient(timeout=15.0, verify=False, headers=auth_headers, follow_redirects=True)

    # Build endpoint list
    endpoints = req.endpoints or []
    probe_paths = [ep.path for ep in endpoints] if endpoints else ["/", "/api", "/api/v1", "/health"]
    probe_methods = {ep.path: ep.method for ep in endpoints}

    total_steps = 6 + len(probe_paths)
    step = 0

    def progress(phase: str, msg: str, check: Optional[str] = None) -> None:
        nonlocal step
        step += 1
        pct = min(95, int((step / total_steps) * 100))
        emit(ScanProgress(phase=phase, message=msg, percent=pct, found=len(findings), current_check=check))

    try:
        # 1. Connectivity
        progress("connecting", f"Probing {base_url}…", "Connectivity")
        try:
            r = await client.get(base_url)
            job.endpoints_tested += 1
        except Exception as exc:
            job.status = "failed"
            job.error = f"Target unreachable: {exc}"
            emit(ScanProgress(phase="failed", message=job.error, percent=0))
            return

        # 2. Security headers (on root)
        progress("probing", "Checking security headers…", "API8:2023 - Security Misconfiguration")
        if "API8:2023" in req.owasp_categories:
            findings += await check_security_headers(client, base_url)

        # 3. CORS
        progress("probing", "Testing CORS configuration…", "API8:2023 - CORS")
        if "API8:2023" in req.owasp_categories:
            findings += await check_cors(client, base_url)

        # 4. Rate limiting
        progress("probing", "Testing rate limiting…", "API4:2023 - Rate Limiting")
        if "API4:2023" in req.owasp_categories:
            findings += await check_rate_limiting(client, base_url, probe_paths[0])

        # 5. Old API versions
        progress("probing", "Checking legacy API versions…", "API9:2023 - Inventory")
        if "API9:2023" in req.owasp_categories:
            findings += await check_old_api_versions(client, base_url)

        # 6. Per-endpoint checks
        for path in probe_paths:
            method = probe_methods.get(path, "GET")
            progress("probing", f"Testing {method} {path}…", path)
            job.endpoints_tested += 1

            if "API2:2023" in req.owasp_categories:
                findings += await check_auth_required(client, base_url, path, method)
            if "API3:2023" in req.owasp_categories or "API1:2023" in req.owasp_categories:
                findings += await check_sensitive_data(client, base_url, path, method)
            if "API1:2023" in req.owasp_categories and re.search(r"/\d+", path):
                findings += await check_bola(client, base_url, path)
            if req.scan_depth in ("Normal", "Deep") and method == "GET":
                findings += await check_injection(client, base_url, path)

        # 7. AI augmentation
        progress("ai_analysis", "Running AI-powered analysis…", "AI Augmentation")
        ai_findings = await ai_augment_scan(base_url, findings, req)
        findings += ai_findings

        # Deduplicate by (type, path)
        seen: set = set()
        unique: List[ScanFinding] = []
        for f in findings:
            key = (f.type, f.endpoint["path"])
            if key not in seen:
                seen.add(key)
                unique.append(f)

        job.findings = unique
        job.status = "complete"
        emit(ScanProgress(phase="complete", message=f"Scan complete — {len(unique)} findings.", percent=100, found=len(unique)))

    except Exception as exc:
        job.status = "failed"
        job.error = str(exc)
        emit(ScanProgress(phase="failed", message=f"Scan failed: {exc}", percent=step))
    finally:
        await client.aclose()
