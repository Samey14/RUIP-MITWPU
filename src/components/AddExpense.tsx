import React, { useState } from 'react';
import { FacultyCoordinator, ImmersionCamp, Expense, Attachment } from '../types';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Camera,
  Upload,
  FileText,
  Trash2
} from 'lucide-react';

interface AddExpenseProps {
  setActiveScreen: (screen: string) => void;
  onAddExpense: (expense: Expense) => void;
  faculty: FacultyCoordinator;
  immersion: ImmersionCamp;
  currentTotalSpent: number;
}

const CATEGORIES = [
  'Food',
  'Grocery',
  'Transportation',
  'Mattress',
  'Stationery',
  'Fuel',
  'Faculty Expense',
  'Accommodation',
  'Medical',
  'Miscellaneous',
];

export const AddExpense: React.FC<AddExpenseProps> = ({
  setActiveScreen,
  onAddExpense,
  faculty,
  immersion,
  currentTotalSpent,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('Food');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI / online' | 'Card' | 'Net Banking'>('Cash');
  const [description, setDescription] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [chargeTo, setChargeTo] = useState('Students (64)');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const amount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const projectedTotal = currentTotalSpent + amount;
  const projectedBalance = immersion.advanceReceived - projectedTotal;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bill' | 'upi') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const newAtt: Attachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        type,
        sizeKb: Math.round(file.size / 1024),
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments(prev => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (addAnother = false) => {
    setErrorMsg(null);
    if (amount <= 0) {
      setErrorMsg('Please enter an amount greater than ₹0');
      return;
    }
    if (!vendor.trim()) {
      setErrorMsg('Please enter a vendor or payee name');
      return;
    }
    if (!billNumber.trim()) {
      setErrorMsg('Bill Number / Memo Number is mandatory. Please fill in the bill, voucher, or memo number.');
      return;
    }

    const hasBill = attachments.some(a => a.type === 'bill');
    const hasUpi = attachments.some(a => a.type === 'upi');

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date,
      category,
      vendor: vendor.trim(),
      amount,
      paymentMode,
      description: description.trim() || undefined,
      billNumber: billNumber.trim(),
      chargeTo,
      paidByFaculty: faculty.name,
      attachments,
      hasBillProof: hasBill,
      hasUpiProof: paymentMode === 'Cash' ? true : hasUpi,
      billVerification: hasBill ? 'Pending' : 'Pending',
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense);
    setSuccessMsg(`Logged ₹${amount.toLocaleString('en-IN')} for ${vendor.trim()}`);
    setTimeout(() => setSuccessMsg(null), 3500);

    if (addAnother) {
      setAmountStr('');
      setVendor('');
      setDescription('');
      setBillNumber('');
      setAttachments([]);
    } else {
      setActiveScreen('ledger');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title & Projected Balance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <button
            onClick={() => setActiveScreen('ledger')}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition font-mono-tabular mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Ledger
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
            Log New Expense
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Camp: {immersion.village} · Recorded by {faculty.name} ({faculty.department})
          </p>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-right font-mono-tabular">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">
            Projected Balance
          </span>
          <span
            className={`text-sm font-bold ${
              projectedBalance < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {projectedBalance < 0
              ? `−₹${Math.abs(projectedBalance).toLocaleString('en-IN')}`
              : `₹${projectedBalance.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CircleAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline text-rose-600 dark:text-rose-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Form */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-base font-bold font-mono-tabular focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Vendor / Payee Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              placeholder="e.g. Marimata Hotel, Kirana Store, Kiran Transport"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Payment Mode
            </label>
            <select
              value={paymentMode}
              onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Cash">Cash</option>
              <option value="UPI / online">UPI / Online</option>
              <option value="Card">Debit / Credit Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Bill / Memo Number <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800 font-mono-tabular">Mandatory</span>
            </label>
            <input
              type="text"
              required
              value={billNumber}
              onChange={e => setBillNumber(e.target.value)}
              placeholder="e.g. INV-1049 / Voucher #88 (Mandatory)"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border ${
                errorMsg && !billNumber.trim()
                  ? 'border-rose-500 focus:ring-rose-500 ring-1 ring-rose-500/30'
                  : 'border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500'
              } text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Charge Head
            </label>
            <select
              value={chargeTo}
              onChange={e => setChargeTo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Students (64)">Students (64)</option>
              <option value="Faculty (3)">Faculty (3)</option>
              <option value="Shared">Shared</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Purpose & Description
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Lunch for student batch, generator diesel for camp site"
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* File Attachments */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Attach Bill / UPI Proof
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-800/60 cursor-pointer transition text-xs text-zinc-600 dark:text-zinc-300">
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Attach Vendor Bill / Receipt</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={e => handleFileUpload(e, 'bill')}
              />
            </label>

            {paymentMode === 'UPI / online' && (
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 bg-zinc-50 dark:bg-zinc-800/60 cursor-pointer transition text-xs text-zinc-600 dark:text-zinc-300">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Attach UPI Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'upi')}
                />
              </label>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono-tabular">
                      ({att.type})
                    </span>
                  </div>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="text-zinc-400 hover:text-rose-500 transition p-1"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveScreen('ledger')}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition"
          >
            Save & Add Another
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
};
