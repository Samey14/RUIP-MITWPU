"""
Rural Immersion Programme (RUIP) - Expense Analytics Engine
MIT World Peace University, Pune - Accounts & Finance Directorate
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import defaultdict


def compute_expense_statistics(expenses: List[Dict[str, Any]], advance_amount: float = 58000.0) -> Dict[str, Any]:
    """
    Computes ledger metrics, aggregate expenditure, and verification distributions.
    """
    if not expenses:
        return {
            "total_expenses": 0,
            "total_amount": 0.0,
            "advance_received": advance_amount,
            "balance_remaining": advance_amount,
            "is_deficit": False,
            "average_expense": 0.0,
            "max_expense": 0.0,
            "verified_count": 0,
            "pending_count": 0,
            "rejected_count": 0,
            "verified_amount": 0.0,
            "pending_amount": 0.0,
            "rejected_amount": 0.0,
            "with_bill_proof_count": 0,
            "with_upi_proof_count": 0,
        }

    total_amount = sum(float(e.get("amount", 0)) for e in expenses)
    amounts = [float(e.get("amount", 0)) for e in expenses]

    verified = [e for e in expenses if e.get("billVerification") == "Verified"]
    pending = [e for e in expenses if e.get("billVerification") in ("Pending", None)]
    rejected = [e for e in expenses if e.get("billVerification") == "Rejected"]

    with_bill = sum(1 for e in expenses if e.get("hasBillProof") or (e.get("attachments") and any(a.get("type") == "bill" for a in e.get("attachments", []))))
    with_upi = sum(1 for e in expenses if e.get("hasUpiProof") or (e.get("attachments") and any(a.get("type") == "upi" for a in e.get("attachments", []))))

    balance = advance_amount - total_amount

    return {
        "total_expenses": len(expenses),
        "total_amount": round(total_amount, 2),
        "advance_received": advance_amount,
        "balance_remaining": round(balance, 2),
        "is_deficit": balance < 0,
        "average_expense": round(total_amount / len(expenses), 2) if expenses else 0.0,
        "max_expense": max(amounts) if amounts else 0.0,
        "verified_count": len(verified),
        "pending_count": len(pending),
        "rejected_count": len(rejected),
        "verified_amount": round(sum(float(e.get("amount", 0)) for e in verified), 2),
        "pending_amount": round(sum(float(e.get("amount", 0)) for e in pending), 2),
        "rejected_amount": round(sum(float(e.get("amount", 0)) for e in rejected), 2),
        "with_bill_proof_count": with_bill,
        "with_upi_proof_count": with_upi,
    }


def compute_breakdowns(expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes categorized breakdowns by category, payment method, faculty coordinator, and date.
    """
    by_category = defaultdict(lambda: {"count": 0, "total": 0.0})
    by_payment_mode = defaultdict(lambda: {"count": 0, "total": 0.0})
    by_faculty = defaultdict(lambda: {"count": 0, "total": 0.0, "verified": 0, "pending": 0, "rejected": 0})
    by_date = defaultdict(lambda: {"count": 0, "total": 0.0})

    for exp in expenses:
        amt = float(exp.get("amount", 0))
        cat = exp.get("category", "General")
        pm = exp.get("paymentMode", "Cash")
        fac = exp.get("paidByFaculty", "Unassigned")
        dt = exp.get("date", "Unknown")
        status = exp.get("billVerification", "Pending")

        by_category[cat]["count"] += 1
        by_category[cat]["total"] = round(by_category[cat]["total"] + amt, 2)

        by_payment_mode[pm]["count"] += 1
        by_payment_mode[pm]["total"] = round(by_payment_mode[pm]["total"] + amt, 2)

        by_faculty[fac]["count"] += 1
        by_faculty[fac]["total"] = round(by_faculty[fac]["total"] + amt, 2)
        if status == "Verified":
            by_faculty[fac]["verified"] += 1
        elif status == "Rejected":
            by_faculty[fac]["rejected"] += 1
        else:
            by_faculty[fac]["pending"] += 1

        by_date[dt]["count"] += 1
        by_date[dt]["total"] = round(by_date[dt]["total"] + amt, 2)

    return {
        "by_category": dict(by_category),
        "by_payment_mode": dict(by_payment_mode),
        "by_faculty": dict(by_faculty),
        "by_date": dict(sorted(by_date.items())),
    }


def compute_burn_rate_forecast(
    expenses: List[Dict[str, Any]],
    advance_amount: float = 58000.0,
    total_camp_days: int = 7,
    current_day: int = 6
) -> Dict[str, Any]:
    """
    Calculates burn rate projections and expected final surplus or deficit.
    """
    total_spent = sum(float(e.get("amount", 0)) for e in expenses)
    days_elapsed = max(1, current_day)
    remaining_days = max(0, total_camp_days - days_elapsed)

    daily_burn_rate = round(total_spent / days_elapsed, 2)
    projected_total = round(daily_burn_rate * total_camp_days, 2)
    projected_balance = round(advance_amount - projected_total, 2)
    advance_utilization_pct = round((total_spent / advance_amount) * 100, 1) if advance_amount > 0 else 0

    return {
        "total_spent_so_far": round(total_spent, 2),
        "advance_amount": advance_amount,
        "days_elapsed": days_elapsed,
        "total_camp_days": total_camp_days,
        "remaining_days": remaining_days,
        "daily_burn_rate": daily_burn_rate,
        "projected_total_expense": projected_total,
        "projected_final_balance": projected_balance,
        "advance_utilization_pct": advance_utilization_pct,
        "status": "DEFICIT_PROJECTED" if projected_balance < 0 else "WITHIN_BUDGET",
        "recommended_daily_cap_remaining": round((advance_amount - total_spent) / remaining_days, 2) if remaining_days > 0 and (advance_amount - total_spent) > 0 else 0.0
    }


def validate_expense_compliance(
    expenses: List[Dict[str, Any]],
    high_value_threshold: float = 10000.0,
    cash_limit_threshold: float = 5000.0
) -> List[Dict[str, Any]]:
    """
    Checks expenditure compliance with MIT-WPU finance policy:
    - High-value claims requiring special invoice scrutiny
    - Cash transactions above standard disbursement limit
    - Unvouched expenses lacking digital receipt proof
    """
    flagged: List[Dict[str, Any]] = []

    for exp in expenses:
        eid = exp.get("id", "unknown")
        amt = float(exp.get("amount", 0))
        vendor = exp.get("vendor", "Unknown")
        pm = exp.get("paymentMode", "Cash")
        has_bill = exp.get("hasBillProof", False)
        attachments = exp.get("attachments", [])

        if amt >= high_value_threshold:
            flagged.append({
                "expense_id": eid,
                "vendor": vendor,
                "amount": amt,
                "type": "HIGH_VALUE",
                "message": f"Claim of Rs. {amt:,.2f} exceeds threshold Rs. {high_value_threshold:,.2f}. Itemized invoice required."
            })

        if pm.lower() == "cash" and amt > cash_limit_threshold:
            flagged.append({
                "expense_id": eid,
                "vendor": vendor,
                "amount": amt,
                "type": "CASH_LIMIT_EXCEEDED",
                "message": f"Cash payment of Rs. {amt:,.2f} exceeds policy ceiling (Rs. {cash_limit_threshold:,.2f})."
            })

        if not has_bill and not attachments:
            flagged.append({
                "expense_id": eid,
                "vendor": vendor,
                "amount": amt,
                "type": "MISSING_PROOF",
                "message": f"Transaction of Rs. {amt:,.2f} has no bill attachment."
            })

    return flagged
