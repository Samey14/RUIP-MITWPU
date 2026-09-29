"""
Rural Immersion Programme (RUIP) - Statement Document Generator
MIT World Peace University, Pune - Accounts & Finance Directorate
"""

from typing import List, Dict, Any
from datetime import datetime
from .analytics import compute_expense_statistics, compute_breakdowns


def generate_settlement_statement_text(
    expenses: List[Dict[str, Any]],
    camp_info: Dict[str, Any],
    coordinator_name: str = "Faculty Coordinator"
) -> str:
    """
    Generates an official formatted settlement statement document for the Accounts Department.
    """
    stats = compute_expense_statistics(expenses, float(camp_info.get("advanceReceived", 58000)))
    breakdowns = compute_breakdowns(expenses)

    trip_code = camp_info.get("tripCode", "RUIP-2026")
    village = camp_info.get("village", "Camp Village")
    district = camp_info.get("district", "Pune")
    now_str = datetime.now().strftime("%d-%b-%Y %H:%M")

    lines = []
    lines.append("==========================================================================================")
    lines.append("                   DR. VISHWANATH KARAD MIT WORLD PEACE UNIVERSITY, PUNE                   ")
    lines.append("                     CENTRE FOR INDUSTRY-ACADEMIA PARTNERSHIPS (CIAP)                      ")
    lines.append("                 ACCOUNTS & FINANCE DIRECTORATE — RURAL IMMERSION PROGRAMME               ")
    lines.append("==========================================================================================")
    lines.append(f"Statement Ref : {trip_code}-SETTLE-FINAL               Date: {now_str}")
    lines.append(f"Camp Village  : {village} (Dist. {district})             Total Days: {camp_info.get('totalDays', 7)}")
    lines.append(f"Coordinator   : {coordinator_name}                       Academic Year: {camp_info.get('academicYear', '2025-26')}")
    lines.append("------------------------------------------------------------------------------------------")
    lines.append("FINANCIAL RECONCILIATION SUMMARY:")
    lines.append(f"  1. University Advance Received  : Rs. {stats['advance_received']:>12,.2f}  [Sanctioned]")
    lines.append(f"  2. Total Field Expenses Incurred: Rs. {stats['total_amount']:>12,.2f}  [{stats['total_expenses']} Vouchers]")
    lines.append(f"  3. Net Balance Claim / Refund   : Rs. {stats['balance_remaining']:>12,.2f}  [{'REIMBURSEMENT PAYABLE' if stats['is_deficit'] else 'REFUND TO UNIVERSITY'}]")
    lines.append(f"  4. Audited Verified Vouchers    : Rs. {stats['verified_amount']:>12,.2f}  [{stats['verified_count']} Cleared]")
    lines.append(f"  5. Pending Audit Vouchers       : Rs. {stats['pending_amount']:>12,.2f}  [{stats['pending_count']} Pending]")
    lines.append("------------------------------------------------------------------------------------------")
    lines.append(f"{'VCH ID':<10} {'DATE':<12} {'CATEGORY':<14} {'VENDOR':<24} {'MODE':<10} {'AMOUNT (Rs.)':>12}")
    lines.append("------------------------------------------------------------------------------------------")

    for e in expenses:
        lines.append(
            f"{e.get('id', ''):<10} "
            f"{e.get('date', ''):<12} "
            f"{e.get('category', ''):<14} "
            f"{e.get('vendor', '')[:23]:<24} "
            f"{e.get('paymentMode', ''):<10} "
            f"{float(e.get('amount', 0)):>12,.2f}"
        )

    lines.append("------------------------------------------------------------------------------------------")
    lines.append(f"{'TOTAL CLAIMED':<70} Rs. {stats['total_amount']:>12,.2f}")
    lines.append("==========================================================================================")
    lines.append("                               SIGNATURES & VERIFICATION                                  ")
    lines.append("                                                                                          ")
    lines.append("  _____________________________           _____________________________                  ")
    lines.append("  Faculty Coordinator Signature           Accounts & Audit Officer                       ")
    lines.append(f"  ({coordinator_name})                   (MIT-WPU Finance Directorate)                  ")
    lines.append("==========================================================================================")

    return "\n".join(lines)


def generate_pdf_statement_bytes(
    expenses: List[Dict[str, Any]],
    camp_info: Dict[str, Any],
    coordinator_name: str = "Faculty Coordinator"
) -> bytes:
    """
    Returns the settlement document as UTF-8 encoded text bytes.
    """
    text = generate_settlement_statement_text(expenses, camp_info, coordinator_name)
    return text.encode("utf-8")
