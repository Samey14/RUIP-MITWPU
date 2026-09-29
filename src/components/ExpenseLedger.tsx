import React, { useState } from 'react';
import { ImmersionCamp, Expense } from '../types';
import { downloadExpenseBill } from '../utils/billGenerator';
import {
  Receipt,
  Download,
  CirclePlus,
  AlertTriangle,
  Search,
  X,
  Eye,
  Trash2
} from 'lucide-react';

interface ExpenseLedgerProps {
  setActiveScreen: (screen: string) => void;
  expenses: Expense[];
  immersion: ImmersionCamp;
  onDeleteExpense: (id: string) => void;
  onViewExpenseReceipt: (expense: Expense) => void;
  onExportCsv: () => void;
  canAddExpense?: boolean;
}

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  setActiveScreen,
  expenses,
  immersion,
  onDeleteExpense,
  onViewExpenseReceipt,
  onExportCsv,
  canAddExpense = true,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [proofFilter, setProofFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);

  let running = immersion.advanceReceived;
  const chronological = [...expenses]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e, idx) => {
      running -= e.amount;
      return {
        ...e,
        entryIndex: idx + 1,
        runningBalance: running,
      };
    });

  const filtered = chronological.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      const matchVendor = e.vendor.toLowerCase().includes(q);
      const matchDesc = (e.description || '').toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchBill = (e.billNumber || '').toLowerCase().includes(q);
      if (!matchVendor && !matchDesc && !matchCat && !matchBill) return false;
    }
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    const isMissing = !e.hasBillProof || (e.paymentMode === 'UPI / online' && !e.hasUpiProof);
    if (proofFilter === 'missing' && !isMissing) return false;
    if (proofFilter === 'verified' && isMissing) return false;
    if (proofFilter === 'rejected' && e.billVerification !== 'Rejected') return false;
    return true;
  });

  const totalFiltered = filtered.reduce((acc, curr) => acc + curr.amount, 0);
  const totalAll = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const missingCount = expenses.filter(
    e => !e.hasBillProof || (e.paymentMode === 'UPI / online' && !e.hasUpiProof)
  ).length;
  const rejectedCount = expenses.filter(e => e.billVerification === 'Rejected').length;

  const categories = Array.from(new Set(expenses.map(e => e.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
              Expense Ledger
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono-tabular">
            {expenses.length} total entries · Total Spent: ₹{totalAll.toLocaleString('en-IN')} · Advance: ₹{immersion.advanceReceived.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportCsv}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canAddExpense && (
            <button
              onClick={() => setActiveScreen('add')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <CirclePlus className="w-4 h-4" />
              <span>Add Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if any bills have remarks */}
      {rejectedCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900 dark:text-rose-200 text-sm font-heading">
                {rejectedCount} {rejectedCount === 1 ? 'Bill Entry Has' : 'Bill Entries Have'} Been Rejected by Accounts
              </h4>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5 font-mono-tabular">
                Accounts audit has requested clarification or documentation. Review the remarks below and upload updated vouchers.
              </p>
            </div>
          </div>
          <button
            onClick={() => setProofFilter(proofFilter === 'rejected' ? 'all' : 'rejected')}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shrink-0 shadow-xs transition"
          >
            {proofFilter === 'rejected' ? 'Show All Entries' : `Filter ${rejectedCount} Rejected Bills`}
          </button>
        </div>
      )}

      {missingCount > 0 && proofFilter !== 'missing' && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>{missingCount}</strong> entries need physical bill proof or digital receipt attachment.
            </span>
          </div>
          <button
            onClick={() => setProofFilter('missing')}
            className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100 ml-2"
          >
            Filter Missing Only
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by vendor, bill #, category, or note..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={proofFilter}
            onChange={e => setProofFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
          >
            <option value="all">All Proof States</option>
            <option value="verified">Proof Attached</option>
            <option value="missing">Missing Proof</option>
            {rejectedCount > 0 && (
              <option value="rejected">Rejected by Accounts ({rejectedCount})</option>
            )}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-tabular">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 text-[10px] uppercase border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 whitespace-nowrap">Date</th>
                <th className="py-3 px-4">Category & Vendor</th>
                <th className="py-3 px-4">Payment & Bill #</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Proof</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                    No matching expenses found.
                  </td>
                </tr>
              ) : (
                filtered.map(item => {
                  const isMissing = !item.hasBillProof || (item.paymentMode === 'UPI / online' && !item.hasUpiProof);
                  const isRejected = item.billVerification === 'Rejected';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition ${
                        isRejected
                          ? 'bg-rose-50/30 dark:bg-rose-950/20'
                          : isMissing
                          ? 'bg-amber-50/20 dark:bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                        {item.entryIndex}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-300 text-[11px]">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>{item.category}</span>
                          {isRejected && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              Rejected
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">
                          {item.vendor}
                          {item.description ? ` · ${item.description}` : ''}
                        </div>
                        {isRejected && (
                          <div className="mt-1.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300 max-w-sm">
                            <span className="font-bold text-rose-900 dark:text-rose-200 block text-[10px] uppercase tracking-wider">
                              Accounts Remark:
                            </span>
                            <p className="mt-0.5 leading-snug">{item.rejectionRemark || 'Rejected during audit.'}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                        <span>{item.paymentMode}</span>
                        <span className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                          {item.billNumber ? `#${item.billNumber}` : 'No Bill #'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewExpenseReceipt(item)}
                          className="focus:outline-none transition group"
                          title="Click to view uploaded bill image"
                        >
                          {isRejected ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 group-hover:bg-rose-200">
                              Rejected
                            </span>
                          ) : isMissing ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 group-hover:border-amber-500">
                              Missing
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 group-hover:border-emerald-400">
                              Attached
                            </span>
                          )}
                        </button>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-semibold whitespace-nowrap ${
                          item.runningBalance < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {item.runningBalance < 0
                          ? `−₹${Math.abs(item.runningBalance).toLocaleString('en-IN')}`
                          : `₹${item.runningBalance.toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewExpenseReceipt(item)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-center gap-1"
                            title="View uploaded bill image & details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadExpenseBill(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            title="Download bill image"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular px-4">
          <span>Showing {filtered.length} of {expenses.length} entries</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Filtered Total: ₹{totalFiltered.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl space-y-4 font-mono-tabular">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
              Confirm Delete Entry
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to delete the voucher for <strong>{deleteConfirm.vendor}</strong> amounting to <strong>₹{deleteConfirm.amount.toLocaleString('en-IN')}</strong>? This will recompute the settlement balance.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteExpense(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
