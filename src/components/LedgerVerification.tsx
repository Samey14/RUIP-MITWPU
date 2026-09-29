import React, { useState, useMemo } from 'react';
import { Expense, FacultyCoordinator, BillVerificationStatus } from '../types';
import { getExpensePreviewUrl } from '../utils/billGenerator';
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  CircleCheck,
  XCircle,
  Users,
  MessageSquareWarning,
  X,
  AlertCircle
} from 'lucide-react';

interface LedgerVerificationProps {
  expenses: Expense[];
  facultyList: FacultyCoordinator[];
  onViewExpenseReceipt: (expense: Expense) => void;
  onVerify: (expenseId: string, status: BillVerificationStatus, remark?: string) => void;
  onRejectFacultyLedger?: (facultyName: string, remark: string) => void;
}

const ALL_FACULTY = '__ALL_FACULTY__';

const PRESET_REMARKS = [
  'Illegible / blurry bill photo — please re-upload clear tax invoice',
  'Missing vendor GST / printed receipt memo',
  'Amount claimed does not match total on receipt',
  'Missing itemized breakdown of items purchased',
  'Duplicate voucher entry',
  'Expenditure outside approved rural immersion guidelines',
  'Missing faculty sign-off / student attendance manifest',
];

export const LedgerVerification: React.FC<LedgerVerificationProps> = ({
  expenses,
  facultyList,
  onViewExpenseReceipt,
  onVerify,
  onRejectFacultyLedger,
}) => {
  const [rejectModalExpense, setRejectModalExpense] = useState<Expense | null>(null);
  const [rejectModalFaculty, setRejectModalFaculty] = useState<{
    facultyName: string;
    totalBills: number;
    totalAmount: number;
  } | null>(null);
  const [remarkInput, setRemarkInput] = useState('');
  const [modalError, setModalError] = useState('');

  const facultyGroups = useMemo(() => {
    const map = new Map<string, {
      name: string;
      profile?: FacultyCoordinator;
      entries: Expense[];
      total: number;
      pending: number;
      verified: number;
      rejected: number;
    }>();

    for (const exp of expenses) {
      const facName = exp.paidByFaculty || 'Unassigned';
      if (!map.has(facName)) {
        map.set(facName, {
          name: facName,
          profile: facultyList.find(f => f.name === facName),
          entries: [],
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
        });
      }
      const group = map.get(facName)!;
      group.entries.push(exp);
      group.total += exp.amount;

      const v = exp.billVerification || 'Pending';
      if (v === 'Verified') group.verified += 1;
      else if (v === 'Rejected') group.rejected += 1;
      else group.pending += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses, facultyList]);

  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState(ALL_FACULTY);
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(
    facultyGroups[0]?.name ?? null
  );

  const displayedGroups =
    selectedFacultyFilter === ALL_FACULTY
      ? facultyGroups
      : facultyGroups.filter(g => g.name === selectedFacultyFilter);

  const totalPending = facultyGroups.reduce((acc, g) => acc + g.pending, 0);

  const handleOpenExpenseReject = (exp: Expense, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRejectModalExpense(exp);
    setRejectModalFaculty(null);
    setRemarkInput(exp.rejectionRemark || '');
    setModalError('');
  };

  const handleOpenFacultyReject = (
    facultyName: string,
    totalBills: number,
    totalAmount: number,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    setRejectModalFaculty({ facultyName, totalBills, totalAmount });
    setRejectModalExpense(null);
    setRemarkInput('');
    setModalError('');
  };

  const handleConfirmRejection = () => {
    const trimmed = remarkInput.trim();
    if (!trimmed) {
      setModalError('A remark is required when Accounts rejects a bill or ledger.');
      return;
    }

    if (rejectModalExpense) {
      onVerify(rejectModalExpense.id, 'Rejected', trimmed);
      setRejectModalExpense(null);
    } else if (rejectModalFaculty) {
      if (onRejectFacultyLedger) {
        onRejectFacultyLedger(rejectModalFaculty.facultyName, trimmed);
      } else {
        // Fallback: verify all expenses for this faculty as rejected
        const facExpenses = expenses.filter(e => e.paidByFaculty === rejectModalFaculty.facultyName);
        facExpenses.forEach(e => onVerify(e.id, 'Rejected', trimmed));
      }
      setRejectModalFaculty(null);
    }
    setRemarkInput('');
    setModalError('');
  };

  const handleVerifyAllFacultyPending = (group: { entries: Expense[] }, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const pending = group.entries.filter(exp => (exp.billVerification || 'Pending') !== 'Verified');
    pending.forEach(exp => onVerify(exp.id, 'Verified'));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Ledger Verification
            </h1>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Accounts audit queue: select a faculty coordinator, inspect their submitted receipts, and verify or reject entries.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono-tabular">
            Filter Faculty
          </label>
          <div className="relative min-w-[260px]">
            <select
              value={selectedFacultyFilter}
              onChange={e => {
                const val = e.target.value;
                setSelectedFacultyFilter(val);
                setExpandedFaculty(val === ALL_FACULTY ? facultyGroups[0]?.name ?? null : val);
              }}
              className="w-full appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 pr-9 text-xs font-semibold text-zinc-800 dark:text-zinc-100 outline-none focus:border-emerald-500 font-mono-tabular"
            >
              <option value={ALL_FACULTY}>All faculty ledgers ({facultyGroups.length})</option>
              {facultyGroups.map(g => (
                <option key={g.name} value={g.name}>
                  {g.name} — {g.entries.length} bills (₹{g.total.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>

          {totalPending > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-semibold font-mono-tabular">
              <Clock className="w-3.5 h-3.5" />
              <span>{totalPending} bills awaiting verification</span>
            </div>
          )}
        </div>
      </div>

      {facultyGroups.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No expenses logged for this trip yet.
        </div>
      )}

      <div className="space-y-3 font-mono-tabular">
        {displayedGroups.map(group => {
          const isExpanded = expandedFaculty === group.name;
          const initials =
            group.profile?.avatarInitials || group.name.slice(0, 2).toUpperCase();

          return (
            <div
              key={group.name}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs"
            >
              {/* Faculty Group Accordion Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedFaculty(isExpanded ? null : group.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedFaculty(isExpanded ? null : group.name);
                  }
                }}
                className="w-full flex flex-wrap items-center gap-4 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer select-none"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                )}

                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>

                <div className="flex-1 min-w-[160px]">
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-sans">
                    {group.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {group.profile?.department || 'Faculty Coordinator'} · {group.entries.length} bills
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Claim</p>
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    ₹{group.total.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {group.pending > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                      <Clock className="w-3 h-3" /> {group.pending} pending
                    </span>
                  )}
                  {group.verified > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      <CircleCheck className="w-3 h-3" /> {group.verified} verified
                    </span>
                  )}
                  {group.rejected > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      <XCircle className="w-3 h-3" /> {group.rejected} rejected
                    </span>
                  )}
                  {group.pending > 0 && (
                    <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleVerifyAllFacultyPending(group, e)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                        title="Verify all pending bills for this faculty"
                      >
                        Verify All
                      </button>
                      <button
                        onClick={e => handleOpenFacultyReject(group.name, group.entries.length, group.total, e)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 transition"
                        title="Reject this coordinator's entire submitted ledger with an audit remark"
                      >
                        Reject Ledger
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Itemized Bills List */}
              {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {group.entries.map(exp => {
                    const status = exp.billVerification || 'Pending';
                    const hasProof = exp.hasBillProof || exp.hasUpiProof;

                    return (
                      <div
                        key={exp.id}
                        className="p-3.5 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="min-w-[160px] flex-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-sans">
                              {exp.vendor}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {exp.date} · {exp.category} · {exp.paymentMode} {exp.billNumber ? `· #${exp.billNumber}` : ''}
                            </p>
                          </div>

                          <div className="text-right w-28 shrink-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              ₹{exp.amount.toLocaleString('en-IN')}
                            </p>
                          </div>

                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                              status === 'Verified'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : status === 'Rejected'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {status}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => onViewExpenseReceipt(exp)}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                              title="Inspect bill details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {hasProof && status !== 'Verified' && (
                              <button
                                onClick={() => onVerify(exp.id, 'Verified')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                              >
                                <CircleCheck className="w-3 h-3" /> Verify
                              </button>
                            )}
                            {hasProof && status !== 'Rejected' && (
                              <button
                                onClick={e => handleOpenExpenseReject(exp, e)}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1"
                                title="Reject this expense and specify a required remark"
                              >
                                <XCircle className="w-3 h-3" /> Reject with Remark
                              </button>
                            )}
                            {status === 'Rejected' && (
                              <button
                                onClick={e => handleOpenExpenseReject(exp, e)}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition border border-rose-200 dark:border-rose-800"
                              >
                                Edit Remark
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Prominent Rejection Remark Callout */}
                        {status === 'Rejected' && (
                          <div className="ml-16 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200">
                                  Accounts Rejection Remark
                                </span>
                                {exp.rejectedAt && (
                                  <span className="text-[10px] text-rose-500 font-mono">
                                    {new Date(exp.rejectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-rose-800 dark:text-rose-300 mt-0.5 font-sans leading-relaxed">
                                {exp.rejectionRemark || 'No specific remark recorded.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-2 font-mono-tabular">
        <Users className="w-3.5 h-3.5" />
        <span>
          {displayedGroups.length} faculty coordinators ·{' '}
          {displayedGroups.reduce((acc, g) => acc + g.entries.length, 0)} bills total
        </span>
      </div>

      {/* Rejection Remark Modal (Mandatory Remark Dialog) */}
      {(rejectModalExpense || rejectModalFaculty) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    {rejectModalFaculty ? 'Reject Faculty Coordinator Ledger' : 'Reject Expense Entry'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Accounts audit rejection requires a mandatory remark for the coordinator.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setRejectModalExpense(null);
                  setRejectModalFaculty(null);
                  setRemarkInput('');
                  setModalError('');
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Summary Card */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1 font-mono-tabular">
              {rejectModalExpense && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Payee / Vendor:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rejectModalExpense.vendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Claim Amount:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">₹{rejectModalExpense.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Bill Number:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rejectModalExpense.billNumber || 'No Bill #'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Submitted by:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rejectModalExpense.paidByFaculty}</span>
                  </div>
                </>
              )}
              {rejectModalFaculty && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Faculty Coordinator:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rejectModalFaculty.facultyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Submitted Bills:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{rejectModalFaculty.totalBills} bills</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Claim Amount:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">₹{rejectModalFaculty.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>

            {/* Remark Input Form */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Accounts Rejection Remark <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={remarkInput}
                onChange={e => {
                  setRemarkInput(e.target.value);
                  if (e.target.value.trim()) setModalError('');
                }}
                placeholder="Explain reason for rejection (e.g. illegible invoice scan, GST details missing, expense outside policy limit)..."
                className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {modalError && (
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {modalError}
                </p>
              )}

              {/* Fast Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Quick audit reason presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REMARKS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setRemarkInput(p);
                        setModalError('');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-800 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-700 dark:hover:text-rose-300 border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 transition text-left"
                    >
                      + {p}
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
                  setRejectModalExpense(null);
                  setRejectModalFaculty(null);
                  setRemarkInput('');
                  setModalError('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
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
