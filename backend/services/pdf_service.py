"""
PDF report generation using fpdf2.
Produces professional A4 PDF reports for all 4 SOW deliverable types.
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import Any, Dict, List, Optional

from fpdf import FPDF, XPos, YPos

from models.report_models import ReportType, VaptReportRequest

# ─── Colours ──────────────────────────────────────────────────────────────────

C_BG       = (15,  23,  42)   # slate-900
C_HEADER   = (30,  41,  59)   # slate-800
C_ACCENT   = (99,  102, 241)  # indigo-500
C_TEXT     = (30,  41,  59)
C_LIGHT    = (248, 250, 252)
C_BORDER   = (203, 213, 225)

SEV_COLOURS = {
    "Critical": (239, 68,  68),
    "High":     (249, 115, 22),
    "Medium":   (234, 179, 8),
    "Low":      (59,  130, 246),
    "Info":     (139, 92,  246),
}


class SentinelPDF(FPDF):
    def __init__(self, title: str, subtitle: str):
        super().__init__()
        self.title_text = title
        self.subtitle_text = subtitle

    def header(self):
        self.set_fill_color(*C_HEADER)
        self.rect(0, 0, 210, 20, "F")
        self.set_text_color(*C_ACCENT)
        self.set_font("Helvetica", "B", 11)
        self.set_y(6)
        self.cell(0, 8, "SENTINEL API  |  Security Assessment Platform", align="C")
        self.set_text_color(*C_LIGHT)
        self.set_font("Helvetica", "", 7)
        self.set_y(13)
        self.cell(0, 5, "CONFIDENTIAL — NOT FOR PUBLIC DISTRIBUTION", align="C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_fill_color(*C_HEADER)
        self.rect(0, self.get_y(), 210, 15, "F")
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*C_BORDER)
        self.cell(0, 10, f"Page {self.page_no()} | {self.title_text}", align="C")

    def section_title(self, text: str) -> None:
        self.set_fill_color(*C_ACCENT)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 11)
        self.ln(4)
        self.cell(0, 8, f"  {text}", fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*C_TEXT)
        self.ln(2)

    def key_value(self, key: str, value: str) -> None:
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*C_TEXT)
        self.cell(55, 6, key + ":", new_x=XPos.RIGHT)
        self.set_font("Helvetica", "", 9)
        self.multi_cell(0, 6, value)

    def severity_badge(self, sev: str, x: float, y: float) -> None:
        colour = SEV_COLOURS.get(sev, (100, 100, 100))
        self.set_xy(x, y)
        self.set_fill_color(*colour)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 8)
        self.cell(20, 6, sev, fill=True, align="C")
        self.set_text_color(*C_TEXT)


# ─── Cover page ───────────────────────────────────────────────────────────────

def _cover_page(pdf: SentinelPDF, req: VaptReportRequest, report_label: str) -> None:
    pdf.add_page()
    pdf.set_fill_color(*C_BG)
    pdf.rect(0, 0, 210, 297, "F")

    # Logo area
    pdf.set_fill_color(*C_ACCENT)
    pdf.rect(0, 60, 210, 4, "F")
    pdf.set_fill_color(*C_HEADER)
    pdf.rect(0, 64, 210, 80, "F")

    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_y(75)
    pdf.cell(0, 14, req.engagement.project_name, align="C")

    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*C_ACCENT)
    pdf.set_y(95)
    pdf.cell(0, 10, report_label, align="C")

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*C_BORDER)
    pdf.set_y(115)
    pdf.cell(0, 7, req.engagement.client_name, align="C")
    pdf.set_y(123)
    pdf.cell(0, 7, f"Assessment Period: {req.engagement.assessment_date}", align="C")
    pdf.set_y(131)
    pdf.cell(0, 7, f"Report Date: {req.engagement.report_date}", align="C")

    # Standards
    pdf.set_fill_color(*C_ACCENT)
    pdf.rect(0, 200, 210, 4, "F")
    pdf.set_y(210)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*C_BORDER)
    pdf.cell(0, 6, "ALIGNED WITH", align="C")
    pdf.set_y(218)
    pdf.set_font("Helvetica", "", 8)
    pdf.cell(0, 5, "  |  ".join(req.engagement.standards[:3]), align="C")
    pdf.set_y(224)
    pdf.cell(0, 5, "  |  ".join(req.engagement.standards[3:]), align="C")


# ─── VAPT report ──────────────────────────────────────────────────────────────

def _build_vapt(req: VaptReportRequest) -> bytes:
    pdf = SentinelPDF("VAPT Report", "Vulnerability Assessment & Penetration Testing")
    _cover_page(pdf, req, "DETAILED VAPT REPORT")

    # Executive overview
    pdf.add_page()
    pdf.section_title("1. ENGAGEMENT OVERVIEW")
    meta = req.engagement
    for k, v in [
        ("Client", meta.client_name), ("Project", meta.project_name),
        ("Environment", meta.environment), ("Scope", meta.engagement_scope),
        ("Tester", meta.tester_name), ("Assessment Date", meta.assessment_date),
        ("Report Date", meta.report_date),
    ]:
        pdf.key_value(k, v)

    # Stats
    pdf.section_title("2. VULNERABILITY SUMMARY")
    sev_counts = {}
    for v in req.vulnerabilities:
        sev_counts[v.severity] = sev_counts.get(v.severity, 0) + 1
    for sev in ["Critical", "High", "Medium", "Low", "Info"]:
        count = sev_counts.get(sev, 0)
        colour = SEV_COLOURS.get(sev, (0, 0, 0))
        pdf.set_fill_color(*colour)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(35, 7, sev, fill=True, align="C")
        pdf.set_fill_color(*C_LIGHT)
        pdf.set_text_color(*C_TEXT)
        pdf.cell(20, 7, str(count), fill=True, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # Findings detail
    pdf.section_title("3. FINDINGS DETAIL")
    for i, vuln in enumerate(req.vulnerabilities, 1):
        if pdf.get_y() > 240:
            pdf.add_page()
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(*C_TEXT)
        prefix = f"{i}. [{vuln.owasp_id}] {vuln.type}"
        pdf.multi_cell(170, 7, prefix)

        # Severity badge
        bx, by = pdf.get_x(), pdf.get_y() - 7
        pdf.severity_badge(vuln.severity, 175, by)

        pdf.set_font("Helvetica", "", 9)
        for label, val in [
            ("Endpoint", f"{vuln.endpoint_method} {vuln.endpoint_path}"),
            ("CVSS Score", f"{vuln.cvss_score or 'N/A'} — {vuln.cvss_vector or ''}"),
            ("Status", vuln.status),
            ("Description", vuln.description),
            ("Details", vuln.details),
        ]:
            if val:
                pdf.key_value(label, val)
        if vuln.remediation:
            pdf.key_value("Remediation", vuln.remediation[:300] + ("…" if len(vuln.remediation) > 300 else ""))
        pdf.ln(3)
        pdf.set_draw_color(*C_BORDER)
        pdf.line(pdf.l_margin, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(3)

    return bytes(pdf.output())


# ─── Executive summary ────────────────────────────────────────────────────────

def _build_executive(req: VaptReportRequest) -> bytes:
    pdf = SentinelPDF("Executive Summary", "API Security Assessment")
    _cover_page(pdf, req, "EXECUTIVE SUMMARY REPORT")

    pdf.add_page()
    pdf.section_title("ASSESSMENT AT A GLANCE")
    total = len(req.vulnerabilities)
    critical = sum(1 for v in req.vulnerabilities if v.severity == "Critical")
    high = sum(1 for v in req.vulnerabilities if v.severity == "High")
    fixed = sum(1 for v in req.vulnerabilities if v.status == "Fixed")
    risk = "Critical" if critical > 0 else ("High" if high > 0 else "Medium")

    for k, v in [
        ("Overall Risk Rating", risk), ("Total Findings", str(total)),
        ("Critical", str(critical)), ("High", str(high)),
        ("Resolved / Fixed", str(fixed)),
        ("Scope", req.engagement.engagement_scope),
        ("Standards", ", ".join(req.engagement.standards[:2])),
    ]:
        pdf.key_value(k, v)

    pdf.section_title("KEY OBSERVATIONS")
    pdf.set_font("Helvetica", "", 9)
    for v in sorted(req.vulnerabilities, key=lambda x: ["Critical","High","Medium","Low","Info"].index(x.severity))[:5]:
        pdf.multi_cell(0, 6, f"• [{v.severity}] {v.type} — {v.endpoint_method} {v.endpoint_path}")

    if req.executive_summary:
        pdf.section_title("SUMMARY NARRATIVE")
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 6, req.executive_summary)

    return bytes(pdf.output())


# ─── Load test report ─────────────────────────────────────────────────────────

def _build_load_test(req: VaptReportRequest) -> bytes:
    pdf = SentinelPDF("Load Test Report", "Performance & Stability Assessment")
    _cover_page(pdf, req, "LOAD TESTING REPORT")

    pdf.add_page()
    pdf.section_title("TEST CONFIGURATION")
    s = req.load_test_summary or {}
    for k, v in s.items():
        pdf.key_value(k.replace("_", " ").title(), str(v))

    if req.load_test_metrics:
        pdf.section_title("METRICS SNAPSHOT (First 10 Intervals)")
        pdf.set_font("Helvetica", "B", 8)
        headers = ["Elapsed(s)", "RPS", "p50(ms)", "p95(ms)", "p99(ms)", "Error%"]
        widths = [28, 25, 25, 25, 25, 22]
        pdf.set_fill_color(*C_ACCENT)
        pdf.set_text_color(255, 255, 255)
        for h, w in zip(headers, widths):
            pdf.cell(w, 6, h, fill=True, align="C")
        pdf.ln()
        pdf.set_text_color(*C_TEXT)
        for i, m in enumerate(req.load_test_metrics[:10]):
            pdf.set_fill_color(*C_LIGHT if i % 2 == 0 else (240, 240, 240))
            pdf.set_font("Helvetica", "", 8)
            for key, w in zip(["elapsed_seconds","rps","p50_ms","p95_ms","p99_ms","error_rate"], widths):
                pdf.cell(w, 5, str(m.get(key, "")), fill=True, align="C")
            pdf.ln()

    return bytes(pdf.output())


# ─── Attestation certificate ─────────────────────────────────────────────────

def _build_attestation(req: VaptReportRequest) -> bytes:
    pdf = SentinelPDF("Attestation Certificate", "Security Testing")
    pdf.add_page()

    # Gold border
    pdf.set_draw_color(*C_ACCENT)
    pdf.set_line_width(3)
    pdf.rect(8, 8, 194, 281)
    pdf.set_line_width(1)
    pdf.rect(11, 11, 188, 275)

    # Header
    pdf.set_fill_color(*C_BG)
    pdf.rect(11, 11, 188, 40, "F")
    pdf.set_text_color(*C_ACCENT)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_y(22)
    pdf.cell(0, 12, "EXECUTIVE ATTESTATION", align="C")
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(255, 255, 255)
    pdf.set_y(36)
    pdf.cell(0, 8, "of API Security Testing", align="C")

    # Body
    pdf.set_text_color(*C_TEXT)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_y(65)
    pdf.set_x(25)
    body = (
        f"This is to certify that the API endpoints of\n\n"
        f"{req.engagement.client_name}\n\n"
        f"have been subjected to a comprehensive Vulnerability Assessment and Penetration Testing "
        f"(VAPT) engagement, covering {req.engagement.engagement_scope}, conducted during "
        f"{req.engagement.assessment_date}.\n\n"
        f"The assessment was performed by {req.engagement.tester_name} in alignment with "
        f"OWASP API Security Top 10 (2023), CERT-In Guidelines, ISO/IEC 27001:2022, and NIST SP 800-115. "
        f"All identified vulnerabilities were evaluated using the CVSS v3.1 scoring framework.\n\n"
        f"Testing was conducted on the {req.engagement.environment} environment with formal authorisation, "
        f"following responsible disclosure practices. No production systems were disrupted.\n\n"
        f"This certificate confirms the completion of the security testing engagement and is intended "
        f"for sharing with stakeholders, partners, and investors without exposing vulnerability details."
    )
    pdf.multi_cell(160, 7, body)

    # Signature area
    pdf.set_y(220)
    pdf.set_draw_color(*C_BORDER)
    pdf.line(25, 230, 85, 230)
    pdf.line(125, 230, 185, 230)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.set_xy(25, 232)
    pdf.cell(60, 5, "Authorised Signatory", align="C")
    pdf.set_xy(125, 232)
    pdf.cell(60, 5, "Date", align="C")

    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(*C_ACCENT)
    pdf.set_y(245)
    pdf.cell(0, 5, f"Sentinel API Security Platform | Report Date: {req.engagement.report_date}", align="C")

    return bytes(pdf.output())


# ─── Dispatcher ───────────────────────────────────────────────────────────────

def generate_pdf(req: VaptReportRequest) -> bytes:
    if req.report_type == ReportType.VAPT:
        return _build_vapt(req)
    elif req.report_type == ReportType.EXECUTIVE:
        return _build_executive(req)
    elif req.report_type == ReportType.LOAD_TEST:
        return _build_load_test(req)
    elif req.report_type == ReportType.ATTESTATION:
        return _build_attestation(req)
    raise ValueError(f"Unknown report type: {req.report_type}")
