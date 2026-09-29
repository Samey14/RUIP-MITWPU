import React from 'react';
import { FacultyCoordinator, ImmersionCamp, Expense } from '../types';
import {
  CirclePlus,
  ReceiptText,
  AlertTriangle,
  Receipt
} from 'lucide-react';

interface DashboardProps {
  setActiveScreen: (screen: string) => void;
  faculty: FacultyCoordinator;
  immersion: ImmersionCamp;
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onOpenImmersionModal: () => void;
  onViewExpenseReceipt: (expense: Expense) => void;
  canAddExpense?: boolean;
  ledgerScreen?: string;
  isAdmin?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveScreen,
  faculty,
  immersion,
  expenses,
  onOpenAddExpense,
  onOpenImmersionModal,
  onViewExpenseReceipt,
  canAddExpense = true,
  ledgerScreen = 'ledger',
  isAdmin = false,
}) => {
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = immersion.advanceReceived - totalSpent;
  const isDeficit = remaining < 0;
  const percentSpent = immersion.advanceReceived > 0
    ? Math.round((totalSpent / immersion.advanceReceived) * 100)
    : 100;
  const perStudentSpend = immersion.totalStudents > 0
    ? Math.round(totalSpent / immersion.totalStudents)
    : 0;

  const missingProofCount = expenses.filter(
    e => !e.hasBillProof || (e.paymentMode === 'UPI / online' && !e.hasUpiProof)
  ).length;

  let running = immersion.advanceReceived;
  const recentTransactions = [...expenses.map(e => {
    running -= e.amount;
    return { ...e, runningBalance: running };
  })].reverse().slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Camp Header Card */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider mb-1">
              <span>{immersion.village} Immersion Camp</span>
              <span>·</span>
              <span>{immersion.totalDays} Days Camp</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
              Rural Immersion Overview
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isAdmin
                ? `Accounts & Finance overview · ${immersion.totalStudents} students · consolidated coordinator expenses`
                : `Logged by ${faculty.name} (${faculty.department}) · ${immersion.totalStudents} students · ${immersion.totalFaculty} faculty mentors`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canAddExpense && (
              <button
                onClick={onOpenAddExpense}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition flex items-center gap-2"
              >
                <CirclePlus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            )}
            <button
              onClick={() => setActiveScreen(ledgerScreen)}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs transition flex items-center gap-1.5"
            >
              <ReceiptText className="w-4 h-4" />
              <span>{isAdmin ? 'Verify Ledger' : 'View Ledger'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial Overview Metrics */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
          <div className="p-5 sm:p-6">
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Sanctioned Advance
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{immersion.advanceReceived.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular mt-1">
              Date: {immersion.advanceDate}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total Spent
            </span>
            <div className="text-2xl sm:text-3xl font-bold font-mono-tabular text-zinc-900 dark:text-zinc-100 mt-1">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular mt-1">
              {expenses.length} total entries recorded
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <span className="text-xs font-mono-tabular uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Remaining Balance
            </span>
            <div
              className={`text-2xl sm:text-3xl font-bold font-mono-tabular mt-1 ${
                isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDeficit
                ? `−₹${Math.abs(remaining).toLocaleString('en-IN')}`
                : `₹${remaining.toLocaleString('en-IN')}`}
            </div>
            <div className="text-xs font-mono-tabular mt-1">
              {isDeficit ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">Reimbursement due</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Surplus remaining</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar & Sub-metrics */}
        <div className="p-5 sm:p-6 bg-zinc-50/70 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-800 space-y-2 font-mono-tabular">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Budget Utilisation</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{percentSpent}% spent</span>
          </div>
          <div className="relative h-2.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDeficit ? 'bg-rose-500' : percentSpent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentSpent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1">
            <span>
              {isDeficit
                ? `Deficit of ₹${Math.abs(remaining).toLocaleString('en-IN')} beyond advance.`
                : `₹${remaining.toLocaleString('en-IN')} available within sanctioned advance.`}
            </span>
            <span>Avg ₹{perStudentSpend}/student</span>
          </div>
        </div>
      </div>

      {/* Warning banner for Missing Proofs */}
      {missingProofCount > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              {missingProofCount} expense {missingProofCount === 1 ? 'entry requires' : 'entries require'} bill proof or UPI transaction confirmation before final audit.
            </p>
            <p className="text-amber-700 dark:text-amber-300 text-xs">
              {isAdmin
                ? 'Open Ledger Verification to review submitted proof. Faculty must attach any missing documents.'
                : 'Click on an entry below or open the Expense Ledger to attach receipts.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Transactions & Camp Record */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Transactions</span>
            </h3>
            <button
              onClick={() => setActiveScreen(ledgerScreen)}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline transition"
            >
              View all ({expenses.length}) →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-tabular">
              <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category & Vendor</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-center">Proof</th>
                  <th className="py-2.5 px-4 text-right">Running Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {recentTransactions.map(t => {
                  const isMissing = !t.hasBillProof || (t.paymentMode === 'UPI / online' && !t.hasUpiProof);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onViewExpenseReceipt(t)}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition ${
                        isMissing ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {t.category}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                          {t.vendor}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        ₹{t.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isMissing ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            missing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            attached
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                          t.runningBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {t.runningBalance < 0
                          ? `−₹${Math.abs(t.runningBalance).toLocaleString('en-IN')}`
                          : `₹${t.runningBalance.toLocaleString('en-IN')}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Camp Record Information Card */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Camp Record
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono-tabular bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              {immersion.status}
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Village & Taluka</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {immersion.village}, {immersion.taluka}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Department</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{immersion.department}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Duration</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {immersion.startDate} to {immersion.endDate}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Students / Faculty</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {immersion.totalStudents} students · {immersion.totalFaculty} faculty
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800/60 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Advance Received</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{immersion.advanceReceived.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 font-mono-tabular">
              <span className="text-zinc-500 dark:text-zinc-400">Per Student Spend</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{perStudentSpend}</span>
            </div>
            <div className="pt-2">
              <button
                onClick={onOpenImmersionModal}
                className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition"
              >
                Edit Camp Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
