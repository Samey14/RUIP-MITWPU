"""
Rural Immersion Programme (RUIP) - Command Line Interface (CLI) Demonstration Tool
MIT World Peace University, Pune - Accounts & Finance Directorate
"""

import sys
import json
import argparse
from typing import List, Dict, Any

try:
    from .analytics import (
        compute_expense_statistics,
        compute_breakdowns,
        compute_burn_rate_forecast,
        validate_expense_compliance,
    )
    from .pdf_generator import generate_settlement_statement_text
except (ImportError, ValueError):
    from analytics import (
        compute_expense_statistics,
        compute_breakdowns,
        compute_burn_rate_forecast,
        validate_expense_compliance,
    )
    from pdf_generator import generate_settlement_statement_text

# Sample expenses for standalone CLI verification
SAMPLE_EXPENSES: List[Dict[str, Any]] = [
    {
        "id": "exp-01",
        "date": "2026-02-28",
        "category": "Food",
        "vendor": "Marimata Hotel & Lodging",
        "amount": 29500,
        "paymentMode": "Cash",
        "billNumber": "MH-2802",
        "paidByFaculty": "Prof. Prachi Patil",
        "hasBillProof": True,
        "billVerification": "Verified",
    },
    {
        "id": "exp-02",
        "date": "2026-02-28",
        "category": "Grocery",
        "vendor": "Kothari Super Market",
        "amount": 19900,
        "paymentMode": "Cash",
        "billNumber": "KSM-8941",
        "paidByFaculty": "Prof. Prachi Patil",
        "hasBillProof": True,
        "billVerification": "Verified",
    },
    {
        "id": "exp-03",
        "date": "2026-03-01",
        "category": "Mattress",
        "vendor": "Sangam Bhandi & Mandap Decorators",
        "amount": 5600,
        "paymentMode": "Cash",
        "billNumber": "SB-044",
        "paidByFaculty": "Prof. Prachi Patil",
        "hasBillProof": True,
        "billVerification": "Verified",
    },
    {
        "id": "exp-04",
        "date": "2026-03-01",
        "category": "Transportation",
        "vendor": "Kiran Adhav (Village Transport)",
        "amount": 2000,
        "paymentMode": "UPI / online",
        "billNumber": "KA-UPI-01",
        "paidByFaculty": "Prof. Rahul Sharma",
        "hasBillProof": True,
        "billVerification": "Verified",
    },
    {
        "id": "exp-05",
        "date": "2026-03-03",
        "category": "Stationery",
        "vendor": "DMart Shirur",
        "amount": 1867,
        "paymentMode": "Cash",
        "billNumber": "DM-99420",
        "paidByFaculty": "Prof. Prachi Patil",
        "hasBillProof": False,
        "billVerification": "Pending",
    },
]


def print_banner():
    print("""
========================================================================
   MIT-WPU RURAL IMMERSION PROGRAMME (RUIP) - ANALYTICS BACKEND CLI
       Centre for Industry-Academia Partnerships & Accounts Dept
========================================================================
    """)


def run_summary(expenses: List[Dict[str, Any]], advance: float = 58000.0):
    stats = compute_expense_statistics(expenses, advance)
    print("\n--- [ LEDGER FINANCIAL SUMMARY ] ---")
    print(f"Total Transactions : {stats['total_expenses']}")
    print(f"Advance Received   : Rs. {stats['advance_received']:,.2f}")
    print(f"Total Expenditure  : Rs. {stats['total_amount']:,.2f}")
    print(f"Net Balance        : Rs. {stats['balance_remaining']:,.2f} ({'DEFICIT' if stats['is_deficit'] else 'SURPLUS'})")
    print(f"Average Voucher    : Rs. {stats['average_expense']:,.2f}")
    print(f"Maximum Voucher    : Rs. {stats['max_expense']:,.2f}")
    print(f"Verified Claims    : {stats['verified_count']} (Rs. {stats['verified_amount']:,.2f})")
    print(f"Pending Claims     : {stats['pending_count']} (Rs. {stats['pending_amount']:,.2f})")


def run_compliance(expenses: List[Dict[str, Any]]):
    flagged = validate_expense_compliance(expenses)
    print("\n--- [ COMPLIANCE VERIFICATION ] ---")
    if not flagged:
        print("All vouchers comply with institutional expenditure guidelines.")
        return

    print(f"Found {len(flagged)} item(s) requiring attention:")
    for idx, f in enumerate(flagged, 1):
        print(f" {idx}. [{f['type']}] Voucher: {f['expense_id']} | Vendor: {f['vendor']}")
        print(f"    Amount: Rs. {f['amount']:,.2f} | Notice: {f['message']}")


def run_forecast(expenses: List[Dict[str, Any]], advance: float = 58000.0):
    burn = compute_burn_rate_forecast(expenses, advance, total_camp_days=7, current_day=6)
    print("\n--- [ BUDGET BURN RATE FORECAST ] ---")
    print(f"Days Elapsed       : {burn['days_elapsed']} of {burn['total_camp_days']} days ({burn['remaining_days']} days remaining)")
    print(f"Daily Spend Rate   : Rs. {burn['daily_burn_rate']:,.2f} / day")
    print(f"Projected Spend    : Rs. {burn['projected_total_expense']:,.2f}")
    print(f"Projected Balance  : Rs. {burn['projected_final_balance']:,.2f}")
    print(f"Forecast Status    : {burn['status']}")
    print(f"Advance Utilized   : {burn['advance_utilization_pct']}%")


def main():
    parser = argparse.ArgumentParser(description="RUIP Expense Analytics CLI - MIT-WPU")
    parser.add_argument("--summary", action="store_true", help="Print ledger summary statistics")
    parser.add_argument("--compliance", action="store_true", help="Run policy compliance checks")
    parser.add_argument("--forecast", action="store_true", help="Run burn rate projection")
    parser.add_argument("--statement", action="store_true", help="Print formatted settlement statement")
    parser.add_argument("--input", type=str, help="Path to custom JSON file containing expenses array")

    args = parser.parse_args()
    print_banner()

    expenses = SAMPLE_EXPENSES
    if args.input:
        try:
            with open(args.input, "r") as f:
                expenses = json.load(f)
            print(f"Loaded {len(expenses)} expenses from {args.input}")
        except Exception as e:
            print(f"Failed to load {args.input}: {e}, using default sample data.")

    if args.statement:
        camp_info = {
            "tripCode": "RUIP-2026-DURGAON",
            "village": "Durgaon",
            "taluka": "Shirur",
            "district": "Pune",
            "academicYear": "2025-26",
            "advanceReceived": 58000,
            "totalDays": 7
        }
        print(generate_settlement_statement_text(expenses, camp_info, "Prof. Prachi Patil"))
    elif args.compliance:
        run_compliance(expenses)
    elif args.forecast:
        run_forecast(expenses)
    else:
        run_summary(expenses)
        run_compliance(expenses)
        run_forecast(expenses)


if __name__ == "__main__":
    main()
