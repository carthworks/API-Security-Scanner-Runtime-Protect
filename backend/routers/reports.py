"""Reports router — POST /api/report/pdf"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from models.report_models import VaptReportRequest
from services.pdf_service import generate_pdf

router = APIRouter(prefix="/api/report", tags=["Reports"])

REPORT_FILENAMES = {
    "vapt":        "VAPT_Report.pdf",
    "executive":   "Executive_Summary.pdf",
    "load_test":   "Load_Test_Report.pdf",
    "attestation": "Attestation_Certificate.pdf",
}


@router.post("/pdf")
async def create_pdf(req: VaptReportRequest):
    try:
        pdf_bytes = generate_pdf(req)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")
    filename = REPORT_FILENAMES.get(req.report_type, "report.pdf")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
