import React, { useState, useEffect } from 'react';
import { Expense, FacultyCoordinator, ImmersionCamp } from '../types';
import { StorageService } from '../services/storage';
import { numToWordsINR } from '../utils/billGenerator';
import { MitWpuLogo } from './MitWpuLogo';
import { exportSettlementStatement, buildExpensePayload } from '../services/ruipApi';
import {
  FileSpreadsheet,
  Printer,
  Download,
  FileDown,
  ExternalLink,
  Send,
  Check,
  CircleCheck,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ImagePlus,
  Trash2,
  Building,
  XCircle,
  X,
  AlertCircle
} from 'lucide-react';

interface AccountsStatementProps {
  setActiveScreen: (screen: string) => void;
  expenses: Expense[];
  faculty: FacultyCoordinator;
  immersion: ImmersionCamp;
  onExportCsv: () => void;
  allowSubmission?: boolean;
  ledgerScreen?: string;
  statementOnly?: boolean;
  canManageSignatures?: boolean;
  onRejectLedger?: (remark: string) => void;
  onApproveLedger?: () => void;
}

export const AccountsStatement: React.FC<AccountsStatementProps> = ({
  setActiveScreen,
  expenses,
  faculty,
  immersion,
  onExportCsv,
  allowSubmission = true,
  ledgerScreen = 'ledger',
  statementOnly = false,
  canManageSignatures = false,
  onRejectLedger,
  onApproveLedger,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [density, setDensity] = useState<'standard' | 'compact'>('standard');
  const [signatures, setSignatures] = useState<Record<string, string>>(() =>
    StorageService.getSignatures(immersion.tripCode)
  );
  const [sigError, setSigError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [ledgerRemarkInput, setLedgerRemarkInput] = useState('');
  const [ledgerModalError, setLedgerModalError] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdfStatement = async () => {
    try {
      setIsExportingPdf(true);
      const payload = buildExpensePayload(expenses, immersion, faculty.name);
      await exportSettlementStatement(payload);
    } catch (err: any) {
      console.warn('Backend PDF export note:', err?.message || err);
      // Fallback to print
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    setSignatures(StorageService.getSignatures(immersion.tripCode));
    setSigError('');
  }, [immersion.tripCode]);

  const handleSignatureUpload = (key: string, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSigError('Signature files must be images (PNG/JPG/WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSigError('Signature image must be under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...signatures, [key]: String(reader.result) };
      setSignatures(next);
      StorageService.saveSignatures(immersion.tripCode, next);
      setSigError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = (key: string) => {
    const next = { ...signatures };
    delete next[key];
    setSignatures(next);
    StorageService.saveSignatures(immersion.tripCode, next);
  };

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalSpent = sortedExpenses.reduce((s, e) => s + e.amount, 0);
  const advance = immersion.advanceReceived || 0;
  const balance = advance - totalSpent;
  const isFacultyDue = balance < 0;
  const settlementAmt = Math.abs(balance);

  let running = advance;
  const itemsWithRunning = sortedExpenses.map((e, idx) => {
    running -= e.amount;
    return {
      ...e,
      index: idx + 1,
      runningBalance: running,
    };
  });

  const missingProofCount = expenses.filter(
    e => !e.hasBillProof || (e.paymentMode === 'UPI / online' && !e.hasUpiProof)
  ).length;

  const cashTotal = expenses.filter(e => e.paymentMode === 'Cash').reduce((s, e) => s + e.amount, 0);
  const onlineTotal = totalSpent - cashTotal;

  const handleSubmit = () => {
    setSubmitted(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenInNewTab = () => {
    const element = document.getElementById('statement-printable');
    if (!element) return;
    const win = window.open('', '_blank');
    if (!win) {
      window.alert('Please allow pop-ups to open the statement in a new tab.');
      return;
    }
    win.opener = null;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('\n');

    win.document.open();
    win.document.write(`<!doctype html>
<html class="${document.documentElement.className}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${document.baseURI}">
  <title>Final Accounts Statement · MIT-WPU</title>
  ${styles}
  <style>
    body { padding: 24px; background: #f4f4f5; }
    .statement-tab-toolbar {
      position: sticky; top: 16px; z-index: 50; display: flex; justify-content: flex-end;
      max-width: 1024px; margin: 0 auto 16px;
    }
    .statement-tab-toolbar button {
      border: 0; border-radius: 10px; background: #059669; color: white;
      padding: 10px 18px; font: 600 13px sans-serif; cursor: pointer;
    }
    @media print {
      body { padding: 0; }
      .statement-tab-toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="statement-tab-toolbar">
    <button onclick="window.print()">Print Statement</button>
  </div>
  ${element.outerHTML}
</body>
</html>`);
    win.document.close();
  };

  const formattedToday = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const refCode = `MIT-WPU/RUIP/${immersion.academicYear.replace(/–/g, '-')}/${immersion.village.toUpperCase()}-ACC`;

  return (
    <div className={`${statementOnly ? 'max-w-5xl' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5`}>
      {/* Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
                Accounts Statement
              </h2>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Official University Settlement Document · Prepared for MIT-WPU Accounts &amp; Finance Audit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!statementOnly && (
            <>
              <label className="sr-only" htmlFor="statement-density">
                Statement density
              </label>
              <select
                id="statement-density"
                value={density}
                onChange={e => setDensity(e.target.value as any)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500 font-mono-tabular"
              >
                <option value="standard">Standard rows</option>
                <option value="compact">Compact rows (Fit A4)</option>
              </select>
            </>
          )}

          <button
            onClick={onExportCsv}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Export Expense Data to CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenInNewTab}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5"
            title="Open the final statement in a new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Open in Tab</span>
          </button>

          <button
            onClick={handleDownloadPdfStatement}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition flex items-center gap-1.5"
            title="Download Official Statement PDF from Python Backend"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Exporting...' : 'PDF Statement'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            title="Print Statement or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {allowSubmission && (
            <button
              onClick={handleSubmit}
              disabled={submitted}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                submitted
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 cursor-default'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900'
              }`}
            >
              {submitted ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{submitted ? 'Submitted' : 'Submit to Accounts'}</span>
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div className="no-print p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 shadow-sm">
          <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Statement submitted to Accounts!</strong> Official settlement voucher register marked as ready for audit.
          </span>
        </div>
      )}

      {/* Audit Rejection Notice Banner */}
      {immersion.ledgerStatus === 'Rejected' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5 text-xs font-heading">
              <XCircle className="w-4 h-4 text-rose-600" /> Accounts Audit Status: Ledger Rejected
            </span>
            {immersion.ledgerAuditedAt && (
              <span className="font-mono text-[10px] text-rose-500">
                {new Date(immersion.ledgerAuditedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-rose-950 dark:text-rose-100 font-sans">
            Audit Remark: {immersion.ledgerRejectionRemark || 'The ledger was rejected during formal Accounts verification.'}
          </p>
          {immersion.ledgerAuditedBy && (
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
              Audited by: {immersion.ledgerAuditedBy}
            </p>
          )}
        </div>
      )}

      {/* Audit Approved Notice Banner */}
      {immersion.ledgerStatus === 'Verified' && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 shadow-sm">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-heading">
            <CircleCheck className="w-4 h-4 text-emerald-600" /> Accounts Audit Status: Cleared &amp; Approved
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            This immersion camp ledger has been formally verified and approved by the Accounts &amp; Finance department.
          </p>
        </div>
      )}

      {/* Accounts Audit Decision Bar (for Accounts Admin) */}
      {(canManageSignatures || statementOnly) && (onRejectLedger || onApproveLedger) && (
        <div className="no-print p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block font-heading">
              Accounts Audit Clearance Decision
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-mono-tabular">
              Reconcile all bills, inspect supporting proofs, and issue formal audit clearance or reject with a remark.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onApproveLedger && (
              <button
                onClick={onApproveLedger}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition flex items-center gap-1.5 shadow-xs"
              >
                <CircleCheck className="w-4 h-4" />
                <span>Clear &amp; Approve Ledger</span>
              </button>
            )}
            {onRejectLedger && (
              <button
                onClick={() => {
                  setShowRejectModal(true);
                  setLedgerRemarkInput(immersion.ledgerRejectionRemark || '');
                  setLedgerModalError('');
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{immersion.ledgerStatus === 'Rejected' ? 'Update Rejection Remark' : 'Reject Ledger with Remark'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Statement Document on Left, Audit info on Right */}
      <div className={statementOnly ? 'block' : 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'}>
        {/* Printable Official Statement Sheet */}
        <div
          id="statement-printable"
          className={`${
            statementOnly ? 'w-full shadow-sm' : 'lg:col-span-8 shadow-lg'
          } rounded-2xl bg-white text-zinc-900 border border-zinc-200/90 overflow-hidden font-sans print-clean ${
            density === 'compact' ? 'compact-print' : ''
          }`}
        >
          {/* Executive Header Banner */}
          <div className="relative bg-gradient-to-r from-[#002D5C] via-[#003E7E] to-[#0A4D94] text-white p-6 sm:p-7 border-b-4 border-amber-400">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white shadow-md border-2 border-white/80 p-1.5 shrink-0 flex items-center justify-center ring-2 ring-amber-400/50">
                  <MitWpuLogo size="lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-300 bg-white/10 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-amber-300/30">
                      MIT World Peace University · Pune
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold tracking-tight uppercase leading-snug font-heading text-white">
                    Dr. Vishwanath Karad MIT World Peace University
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium">
                    Centre for Industry-Academia Partnerships · Rural Immersion Programme
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono-tabular shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
                  OFFICIAL SETTLEMENT STATEMENT
                </span>
                <span className="text-xs text-white/90 font-semibold block">{refCode}</span>
                <span className="text-[11px] text-blue-200 block">Date: {formattedToday}</span>
              </div>
            </div>
          </div>

          {/* Camp Metadata Tiles */}
          <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-zinc-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Coordinator
                </span>
                <span className="font-bold text-zinc-900 block truncate mt-0.5">{faculty.name}</span>
                <span className="text-[11px] text-zinc-500 block truncate">{faculty.department}</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Location
                </span>
                <span className="font-bold text-zinc-900 block truncate mt-0.5">
                  {immersion.village}, Tal. {immersion.taluka}
                </span>
                <span className="text-[11px] text-zinc-500 block">Dist. {immersion.district}</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Camp Duration
                </span>
                <span className="font-bold text-zinc-900 block truncate mt-0.5">
                  {immersion.startDate} to {immersion.endDate}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold block">
                  {immersion.totalDays} Days Camp
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">
                  Cohort Size
                </span>
                <span className="font-bold text-zinc-900 block mt-0.5">
                  {immersion.totalStudents} Students
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  {immersion.totalFaculty} Faculty Mentors
                </span>
              </div>
            </div>
          </div>

          {/* Financial Abstract Card */}
          <div className="p-5 sm:p-6 border-b border-zinc-200">
            <div className="rounded-2xl border-2 border-zinc-200 overflow-hidden bg-white shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 font-mono-tabular">
                <div className="p-4 sm:p-5 flex flex-col justify-between bg-zinc-50/50">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="uppercase font-bold tracking-wider text-[10px]">
                        1. Advance Disbursed
                      </span>
                      <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900 tracking-tight">
                      ₹{advance.toLocaleString('en-IN')}.00
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-2">
                    Disbursed on {immersion.advanceDate} via University Accounts
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col justify-between bg-zinc-50/50">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                      <span className="uppercase font-bold tracking-wider text-[10px]">
                        2. Actual Expenditure
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-zinc-900 tracking-tight">
                      ₹{totalSpent.toLocaleString('en-IN')}.00
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-2">
                    Itemized across {sortedExpenses.length} audited bills &amp; vouchers
                  </div>
                </div>

                <div className={`p-4 sm:p-5 flex flex-col justify-between ${isFacultyDue ? 'bg-amber-50/70' : 'bg-emerald-50/70'}`}>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`uppercase font-bold tracking-wider text-[10px] ${isFacultyDue ? 'text-amber-800' : 'text-emerald-800'}`}>
                        3. Final Settlement
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          isFacultyDue ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {isFacultyDue ? 'Reimbursement' : 'Surplus Refund'}
                      </span>
                    </div>
                    <div className={`text-2xl font-black tracking-tight ${isFacultyDue ? 'text-amber-950' : 'text-emerald-950'}`}>
                      ₹{settlementAmt.toLocaleString('en-IN')}.00
                    </div>
                  </div>
                  <div className={`text-[11px] font-semibold mt-2 ${isFacultyDue ? 'text-amber-800' : 'text-emerald-800'}`}>
                    {isFacultyDue
                      ? `Payable by University to ${faculty.name}`
                      : 'Unspent Advance Refundable to University'}
                  </div>
                </div>
              </div>

                <div className="p-3 bg-zinc-100/90 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 font-mono-tabular">
                <div>
                  <span className="text-zinc-500 font-bold uppercase text-[10px] mr-2">
                    Settlement Amount in Words:
                  </span>
                  <span className="italic font-bold text-zinc-900">
                    Rupees {numToWordsINR(settlementAmt !== 0 ? settlementAmt : totalSpent)} Only
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audited Against Verified Vouchers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Voucher Register Table */}
          <div className="p-5 sm:p-6 border-b border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-heading">
                  Itemized Voucher Register ({sortedExpenses.length} Entries)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Chronological expenditure ledger audited from official bill receipts
                </p>
              </div>
              <span className="text-[11px] font-mono-tabular text-zinc-500">
                Sorted by Date (Earliest to Latest)
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs font-mono-tabular border-collapse">
                <thead>
                  <tr className="bg-zinc-100/90 text-zinc-700 font-bold text-[10px] uppercase border-b border-zinc-200">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 whitespace-nowrap w-24">Date</th>
                    <th className="py-2.5 px-3 whitespace-nowrap w-24">Bill #</th>
                    <th className="py-2.5 px-3">Particulars / Vendor</th>
                    <th className="py-2.5 px-3 w-28">Category</th>
                    <th className="py-2.5 px-3 w-20">Mode</th>
                    <th className="py-2.5 px-3 text-right w-24">Entry Cost (₹)</th>
                    <th className="py-2.5 px-3 text-right w-28">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80">
                  {itemsWithRunning.map(item => (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        density === 'compact' ? 'text-[11px]' : 'text-xs'
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-zinc-400 font-mono text-[11px]">
                        {item.index}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-zinc-600">{item.date}</td>
                      <td className="py-2 px-3 font-mono text-zinc-600">
                        {item.billNumber || `VCH-${item.index}`}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-zinc-900">{item.vendor}</div>
                        {item.description && (
                          <div className="text-[10px] text-zinc-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-zinc-700">{item.category}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            item.paymentMode === 'UPI / online'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.paymentMode === 'UPI / online' ? 'Online' : 'Cash'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-zinc-900 whitespace-nowrap">
                        ₹{item.amount.toLocaleString('en-IN')}.00
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-semibold whitespace-nowrap ${
                          item.runningBalance < 0 ? 'text-rose-600' : 'text-zinc-700'
                        }`}
                      >
                        {item.runningBalance < 0
                          ? `−₹${Math.abs(item.runningBalance).toLocaleString('en-IN')}`
                          : `₹${item.runningBalance.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-300 text-xs">
                    <td colSpan={6} className="py-3 px-3 text-right uppercase text-zinc-700">
                      Total Immersion Expenditure (INR):
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-extrabold text-zinc-900">
                      ₹{totalSpent.toLocaleString('en-IN')}.00
                    </td>
                    <td
                      className={`py-3 px-3 text-right text-xs font-bold ${
                        balance < 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {balance < 0
                        ? `−₹${Math.abs(balance).toLocaleString('en-IN')}`
                        : `₹${balance.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Statutory Approvals & Signatures Block */}
          <div className="sig-block p-6 sm:p-7 bg-slate-50/90">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-5">
              <span>Approvals &amp; Settlement Clearance</span>
              <span>Authorised Signatures</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
              {[
                {
                  key: 'coordinator',
                  title: 'Faculty Coordinator',
                  name: faculty.name,
                  desc: 'Prepared & Submitted by Mentor',
                },
                {
                  key: 'programmeHead',
                  title: 'Head, Rural Immersion Cell',
                  name: 'Rashmi Warke / Dr. Ajit Deore',
                  desc: 'Verified & Recommended',
                },
                {
                  key: 'finance',
                  title: 'Finance Comptroller / Dean',
                  name: 'Accounts & Finance Officer',
                  desc: 'Audited, Passed & Settled',
                },
              ].map(sig => (
                <div key={sig.key} className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="h-20 border-b border-zinc-300 flex items-end justify-center pb-2">
                    {signatures[sig.key] ? (
                      <img
                        src={signatures[sig.key]}
                        alt={`${sig.title} signature`}
                        className="max-h-16 max-w-full object-contain mix-blend-multiply"
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-300 font-mono-tabular">
                        Signature Stamp
                      </span>
                    )}
                  </div>
                  <div className="pt-2">
                    <span className="font-bold text-zinc-900 text-xs block">{sig.name}</span>
                    <span className="text-[10px] text-zinc-600 block">{sig.title}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">{sig.desc}</span>
                  </div>

                  {canManageSignatures && (
                    <div className="no-print flex items-center justify-center gap-2 mt-3 pt-3 border-t border-zinc-100">
                      <label
                        htmlFor={`signature-file-${sig.key}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        {signatures[sig.key] ? 'Replace' : 'Attach Signature'}
                      </label>
                      <input
                        id={`signature-file-${sig.key}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={e => {
                          handleSignatureUpload(sig.key, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      {signatures[sig.key] && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSignature(sig.key)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canManageSignatures && sigError && (
              <p role="alert" className="no-print mt-3 text-center text-[11px] text-rose-600">
                {sigError}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Summary on Desktop */}
        {!statementOnly && (
          <div className="lg:col-span-4 no-print space-y-4 font-mono-tabular">
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Accounts Audit Summary</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <span className="text-zinc-500">Sanctioned Advance:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{advance.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <span className="text-zinc-500">Total Spent:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    ₹{totalSpent.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isFacultyDue
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block">
                      {isFacultyDue ? 'Due to Coordinator' : 'Refund to University'}
                    </span>
                    <span className="text-xs opacity-80">
                      {isFacultyDue ? 'Reimbursement Claim' : 'Surplus Advance'}
                    </span>
                  </div>
                  <span className="text-lg font-black">
                    ₹{settlementAmt.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>

            {missingProofCount > 0 ? (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>{missingProofCount} Missing Proofs</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Accounts Department requires valid physical bills or digital receipt attachments for all entries before reimbursement clearance.
                </p>
                <button
                  onClick={() => setActiveScreen(ledgerScreen)}
                  className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline pt-1 block"
                >
                  {ledgerScreen === 'admin-bills' ? 'Open verification queue →' : 'Review Ledger & Attach Proofs →'}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>All {sortedExpenses.length} entries have verified proof attached. Ready for audit!</span>
              </div>
            )}

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 text-xs font-mono-tabular">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Disbursement Method Split
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cash Payments:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    ₹{cashTotal.toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">UPI / Digital:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    ₹{onlineTotal.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Ledger Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    Reject Immersion Camp Ledger
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Accounts audit requires a formal remark explaining why the ledger is rejected.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setLedgerModalError('');
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Summary */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1 font-mono-tabular">
              <div className="flex justify-between">
                <span className="text-zinc-500">Immersion Camp:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{immersion.village} ({immersion.district})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sanctioned Advance:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{advance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Claimed:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">₹{totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Bill Entries:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{expenses.length} bills</span>
              </div>
            </div>

            {/* Remark Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Audit Rejection Remark <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={ledgerRemarkInput}
                onChange={e => {
                  setLedgerRemarkInput(e.target.value);
                  if (e.target.value.trim()) setLedgerModalError('');
                }}
                placeholder="Provide detailed audit rejection remarks for the faculty coordinators..."
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {ledgerModalError && (
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {ledgerModalError}
                </p>
              )}

              {/* Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Quick audit reason presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Advance reconciliation mismatch — receipts total does not tally with bank withdrawals',
                    'Mandatory GST invoices missing for vendor transactions above ₹500',
                    'Vehicle transport log lacks driver sign-offs and starting/ending odometer readings',
                    'Hospitality / food expenditures exceed sanctioned camp allocation',
                    'Vouchers lack mandatory mentor / faculty digital signatures',
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setLedgerRemarkInput(preset);
                        setLedgerModalError('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-300 border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setLedgerModalError('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const trimmed = ledgerRemarkInput.trim();
                  if (!trimmed) {
                    setLedgerModalError('A remark is required when Accounts rejects the ledger.');
                    return;
                  }
                  onRejectLedger?.(trimmed);
                  setShowRejectModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
