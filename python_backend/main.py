"""
Rural Immersion Programme (RUIP) - FastAPI Analytics Server
MIT World Peace University, Pune - Accounts & Finance Directorate
"""

from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from .analytics import (
    compute_expense_statistics,
    compute_breakdowns,
    compute_burn_rate_forecast,
    validate_expense_compliance,
)
from .pdf_generator import generate_pdf_statement_bytes

app = FastAPI(
    title="RUIP Expense Analytics API",
    description="Accounts & Finance Directorate Backend Services for MIT-WPU Rural Immersion Programme",
    version="2.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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
def read_root():
    return {
        "service": "RUIP Expense Analytics Service",
        "institution": "Dr. Vishwanath Karad MIT World Peace University, Pune",
        "department": "Accounts & Finance Directorate",
        "status": "online",
        "endpoints": [
            "GET /",
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
        doc_bytes = generate_pdf_statement_bytes(payload.expenses, camp_info, coordinator)

        return Response(
            content=doc_bytes,
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename=RUIP-Settlement-{camp_info.get('tripCode', 'Statement')}.txt"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("python_backend.main:app", host="0.0.0.0", port=8000, reload=True)
