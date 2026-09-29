"""
Rural Immersion Programme (RUIP) - Statement Document Generator
MIT World Peace University, Pune - Accounts & Finance Directorate
Generates genuine, auditable PDF settlement registers using ReportLab.
"""

from typing import List, Dict, Any
from datetime import datetime
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

try:
    from .analytics import compute_expense_statistics, compute_breakdowns
except (ImportError, ValueError):
    from analytics import compute_expense_statistics, compute_breakdowns


def generate_pdf_statement_bytes(
    expenses: List[Dict[str, Any]],
    camp_info: Dict[str, Any],
    coordinator_name: str = "Faculty Coordinator"
) -> bytes:
    """
    Builds a professional, auditable PDF document conforming to MIT-WPU Accounts Directorate standards.
    Returns binary PDF bytes (b'%PDF...').
    """
    buffer = io.BytesIO()

    # Setup document with 36pt (0.5 inch) margins for full A4 coverage
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom typography
    navy = colors.HexColor("#182C54")
    gold = colors.HexColor("#A88434")
    dark_gray = colors.HexColor("#334155")
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#CBD5E1")

    title_style = ParagraphStyle(
        'UnivTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=navy,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        'UnivSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=dark_gray,
        alignment=TA_CENTER,
    )

    doc_header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=gold,
        alignment=TA_CENTER,
    )

    cell_style = ParagraphStyle(
        'CellText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_gray,
    )

    cell_bold = ParagraphStyle(
        'CellTextBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=navy,
    )

    cell_right = ParagraphStyle(
        'CellTextRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=dark_gray,
        alignment=TA_RIGHT,
    )

    cell_right_bold = ParagraphStyle(
        'CellTextRightBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=navy,
        alignment=TA_RIGHT,
    )

    # Compute financial analytics
    advance_amount = float(camp_info.get("advanceReceived", 58000.0))
    stats = compute_expense_statistics(expenses, advance_amount)
    breakdowns = compute_breakdowns(expenses)

    trip_code = str(camp_info.get("tripCode", "RUIP-2026"))
    village = str(camp_info.get("village", "Camp Village"))
    district = str(camp_info.get("district", "Pune"))
    academic_year = str(camp_info.get("academicYear", "2025-26"))
    total_days = camp_info.get("totalDays", 7)
    now_str = datetime.now().strftime("%d-%b-%Y %H:%M")

    story = []

    # 1. Header Block
    story.append(Paragraph("DR. VISHWANATH KARAD MIT WORLD PEACE UNIVERSITY, PUNE", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Centre for Industry-Academia Partnerships (CIAP) · Rural Immersion Programme (RUIP)", subtitle_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("ACCOUNTS & FINANCE AUDIT SETTLEMENT REGISTER", doc_header_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=navy, spaceBefore=0, spaceAfter=8))

    # 2. Metadata Grid
    meta_data = [
        [
            Paragraph(f"<b>Statement Ref:</b> {trip_code}-SETTLE-FINAL", cell_style),
            Paragraph(f"<b>Audit Date:</b> {now_str}", cell_style),
            Paragraph(f"<b>Academic Year:</b> {academic_year}", cell_style),
        ],
        [
            Paragraph(f"<b>Camp Location:</b> {village} (Dist. {district})", cell_style),
            Paragraph(f"<b>Duration:</b> {total_days} Days", cell_style),
            Paragraph(f"<b>Lead Faculty:</b> {coordinator_name}", cell_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[200, 160, 163])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('BOX', (0, 0), (-1, -1), 0.75, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 3. Reconciliation Summary Box
    bal_sign = "Reimbursement Payable to Faculty" if stats['is_deficit'] else "Refund Due to MIT-WPU"
    bal_color = colors.HexColor("#B91C1C") if stats['is_deficit'] else colors.HexColor("#047857")

    recon_data = [
        [
            Paragraph("<b>Sanctioned University Advance</b>", cell_style),
            Paragraph(f"Rs. {stats['advance_received']:,.2f}", cell_right_bold),
            Paragraph("<b>Verified Clearances</b>", cell_style),
            Paragraph(f"{stats['verified_count']} Bills (Rs. {stats['verified_amount']:,.2f})", cell_right),
        ],
        [
            Paragraph("<b>Total Field Spend Incurred</b>", cell_style),
            Paragraph(f"Rs. {stats['total_amount']:,.2f}", cell_right_bold),
            Paragraph("<b>Pending Audit Clearances</b>", cell_style),
            Paragraph(f"{stats['pending_count']} Bills (Rs. {stats['pending_amount']:,.2f})", cell_right),
        ],
        [
            Paragraph(f"<b>Net Settlement ({bal_sign})</b>", cell_bold),
            Paragraph(f"<b>Rs. {stats['balance_remaining']:,.2f}</b>", ParagraphStyle('Bal', parent=cell_right_bold, textColor=bal_color, fontSize=8.5)),
            Paragraph("<b>Vouchers with Proof Attachments</b>", cell_style),
            Paragraph(f"{stats['with_bill_proof_count']} / {stats['total_expenses']} Bills", cell_right),
        ],
    ]
    recon_table = Table(recon_data, colWidths=[150, 110, 163, 100])
    recon_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
        ('BOX', (0, 0), (-1, -1), 1, navy),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(recon_table)
    story.append(Spacer(1, 12))

    # 4. Expense Itemized Ledger Table
    story.append(Paragraph("<b>ITEMIZED EXPENSE VOUCHER LEDGER:</b>", ParagraphStyle('LedgerHdr', parent=cell_bold, fontSize=8.5, textColor=navy)))
    story.append(Spacer(1, 4))

    ledger_header = [
        Paragraph("<b>#</b>", cell_bold),
        Paragraph("<b>Date</b>", cell_bold),
        Paragraph("<b>Category</b>", cell_bold),
        Paragraph("<b>Vendor & Description</b>", cell_bold),
        Paragraph("<b>Payment</b>", cell_bold),
        Paragraph("<b>Status</b>", cell_bold),
        Paragraph("<b>Amount (Rs.)</b>", cell_right_bold),
    ]

    ledger_rows = [ledger_header]
    for idx, e in enumerate(expenses, start=1):
        v_status = str(e.get("billVerification", "Pending"))
        desc = str(e.get("description") or e.get("notes") or "")
        vendor_text = str(e.get("vendor", "Vendor"))
        if desc:
            vendor_text += f" ({desc[:25]}...)" if len(desc) > 25 else f" ({desc})"

        status_color = colors.HexColor("#047857") if v_status == "Verified" else colors.HexColor("#B45309")

        ledger_rows.append([
            Paragraph(str(idx), cell_style),
            Paragraph(str(e.get("date", "")), cell_style),
            Paragraph(str(e.get("category", "")), cell_style),
            Paragraph(vendor_text[:40], cell_style),
            Paragraph(str(e.get("paymentMode", "")), cell_style),
            Paragraph(f"<font color='{status_color}'>{v_status}</font>", cell_style),
            Paragraph(f"{float(e.get('amount', 0)):,.2f}", cell_right),
        ])

    # Total Row
    ledger_rows.append([
        Paragraph("", cell_style),
        Paragraph("", cell_style),
        Paragraph("", cell_style),
        Paragraph("<b>TOTAL CLAIMS SUBMITTED</b>", cell_bold),
        Paragraph(f"{len(expenses)} Vouchers", cell_style),
        Paragraph("", cell_style),
        Paragraph(f"<b>Rs. {stats['total_amount']:,.2f}</b>", cell_right_bold),
    ])

    col_widths = [24, 62, 78, 185, 60, 50, 64]
    ledger_table = Table(ledger_rows, colWidths=col_widths, repeatRows=1)
    ledger_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), navy),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BOX', (0, 0), (-1, -1), 1, navy),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, light_bg]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    # Fix header text colors to white
    for col_idx in range(len(col_widths)):
        ledger_table.setStyle(TableStyle([
            ('TEXTCOLOR', (col_idx, 0), (col_idx, 0), colors.white),
        ]))
    story.append(ledger_table)
    story.append(Spacer(1, 14))

    # 5. Signatures Block
    sig_data = [
        [
            Paragraph("<b>FACULTY COORDINATOR DECLARATION</b>", cell_bold),
            Paragraph("<b>ACCOUNTS & AUDIT CLEARANCE</b>", cell_bold),
        ],
        [
            Paragraph(
                "I hereby certify that the expenditures listed above were genuinely incurred "
                "in direct furtherance of the MIT-WPU Rural Immersion Programme in "
                f"{village} and comply with University financial norms.",
                cell_style
            ),
            Paragraph(
                "The vouchers and receipts submitted have been verified against sanctioned "
                "budget limits and university payment ceilings. Net balance adjustment approved.",
                cell_style
            ),
        ],
        [
            Paragraph("<br/><br/>_____________________________________<br/><b>Signature: Faculty Coordinator</b><br/>Name: " + coordinator_name, cell_style),
            Paragraph("<br/><br/>_____________________________________<br/><b>Finance & Accounts Officer</b><br/>MIT World Peace University, Pune", cell_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[255, 268])
    sig_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.75, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 0), (-1, 0), light_bg),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(KeepTogether(sig_table))

    doc.build(story)
    return buffer.getvalue()
