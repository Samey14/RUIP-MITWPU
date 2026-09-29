"""
Rural Immersion Programme (RUIP) - FastAPI Analytics Server
MIT World Peace University, Pune - Accounts & Finance Directorate
Production-ready API for financial analytics, burn-rate forecasting,
policy compliance verification, and official settlement PDF generation.
"""

import os
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

# Support both package execution (`python -m python_backend.main`)
# and root folder execution (`uvicorn main:app --host 0.0.0.0 --port $PORT`)
try:
    from .analytics import (
        compute_expense_statistics,
        compute_breakdowns,
        compute_burn_rate_forecast,
        validate_expense_compliance,
    )
    from .pdf_generator import generate_pdf_statement_bytes
except (ImportError, ValueError):
    from analytics import (
        compute_expense_statistics,
        compute_breakdowns,
        compute_burn_rate_forecast,
        validate_expense_compliance,
    )
    from pdf_generator import generate_pdf_statement_bytes

app = FastAPI(
    title="RUIP Expense Analytics API",
    description="Accounts & Finance Directorate Backend Services for MIT-WPU Rural Immersion Programme",
    version="2.1.0"
)

# Secure CORS Configuration
# Allows production frontend, development environments, and any custom CORS_ORIGINS
cors_env = os.environ.get("CORS_ORIGINS", "")
user_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

default_origins = [
    "https://ruip-mitwpu.ai.studio",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

all_allowed_origins = list(dict.fromkeys(user_origins + default_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.run\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class ExpensePayload(BaseModel):
    expenses: List[Dict[str, Any]] = Field(default_factory=list)
    advanceReceived: float = 58000.0
    totalDays: int = 7
    currentDay: int = 6
    campInfo: Optional[Dict[str, Any]] = None
    coordinatorName: Optional[str] = "Faculty Coordinator"


@app.get("/")
@app.get("/api/health")
def read_health():
    """
    Production health check endpoint.
    Returns status: ok and service information.
    """
    return {
        "status": "ok",
        "service": "RUIP FastAPI",
        "institution": "Dr. Vishwanath Karad MIT World Peace University, Pune",
        "department": "Accounts & Finance Directorate",
        "endpoints": [
            "GET /api/health",
            "POST /api/analytics/summary",
            "POST /api/analytics/breakdowns",
            "POST /api/analytics/forecast",
            "POST /api/analytics/compliance",
            "POST /api/export/settlement-statement",
        ]
    }


@app.post("/api/analytics/summary")
def get_analytics_summary(payload: ExpensePayload):
    try:
        stats = compute_expense_statistics(payload.expenses, payload.advanceReceived)
        breakdowns = compute_breakdowns(payload.expenses)
        return {
            "success": True,
            "statistics": stats,
            "breakdowns": breakdowns,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analytics/breakdowns")
def get_breakdowns(payload: ExpensePayload):
    try:
        breakdowns = compute_breakdowns(payload.expenses)
        return {
            "success": True,
            "breakdowns": breakdowns,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analytics/forecast")
def get_burn_rate_forecast(payload: ExpensePayload):
    try:
        forecast = compute_burn_rate_forecast(
            payload.expenses,
            payload.advanceReceived,
            payload.totalDays,
            payload.currentDay,
        )
        return {
            "success": True,
            "forecast": forecast,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analytics/compliance")
def check_compliance(payload: ExpensePayload):
    try:
        flagged = validate_expense_compliance(payload.expenses)
        return {
            "success": True,
            "count": len(flagged),
            "flagged": flagged,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export/settlement-statement")
def export_settlement_statement(payload: ExpensePayload):
    try:
        camp_info = payload.campInfo or {
            "tripCode": "RUIP-2026",
            "village": "Rural Village",
            "district": "Pune",
            "academicYear": "2025-26",
            "advanceReceived": payload.advanceReceived,
            "totalDays": payload.totalDays,
        }
        coordinator = payload.coordinatorName or "Faculty Coordinator"
        pdf_bytes = generate_pdf_statement_bytes(payload.expenses, camp_info, coordinator)

        raw_code = str(camp_info.get("tripCode", "STATEMENT")).strip().replace(" ", "_")
        filename = f"RUIP-Settlement-{raw_code}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Type": "application/pdf",
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", os.environ.get("FASTAPI_PORT", 8000)))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
