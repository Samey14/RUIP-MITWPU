import React, { useState } from 'react';
import { Expense, Attachment, BillVerificationStatus } from '../types';
import { getExpensePreviewUrl, downloadExpenseBill } from '../utils/billGenerator';
import {
  Receipt,
  CircleCheck,
  TriangleAlert,
  Download,
  X,
  CloudUpload,
  Image,
  FileText
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  isAdmin?: boolean;
  onVerify?: (expenseId: string, status: BillVerificationStatus, remark?: string) => void;
  onAttachProof?: (expenseId: string, attachment: Attachment) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  expense,
  isAdmin = false,
  onVerify,
  onAttachProof,
}) => {
  const [selectedAttIdx, setSelectedAttIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState('');
  const [rejectError, setRejectError] = useState('');

  if (!isOpen || !expense) return null;

  const isVerified = expense.hasBillProof || (expense.paymentMode === 'UPI / online' && expense.hasUpiProof);
  const activeAttachment = expense.attachments && expense.attachments.length > 0
    ? expense.attachments[selectedAttIdx] || expense.attachments[0]
    : undefined;

  let previewUrl = '';
  if (activeAttachment?.dataUrl) {
    previewUrl = activeAttachment.dataUrl;
  } else {
    previewUrl = getExpensePreviewUrl(expense);
  }

  const handleDownload = () => {
    downloadExpenseBill(expense, activeAttachment);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>, type: 'bill' | 'upi') => {
    const file = e.target.files?.[0];
    if (!file || !onAttachProof) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onAttachProof(expense.id, {
        id: `att-${Date.now()}`,
        name: file.name,
        type,
        sizeKb: Math.round(file.size / 1024),
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      });
      setUploading(false);
      setSelectedAttIdx(expense.attachments.length);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-xs sm:max-w-md font-heading">
                  {expense.vendor}
                </h3>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    <CircleCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    <TriangleAlert className="w-3 h-3" />
                    Proof Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular mt-0.5">
                {expense.date} · {expense.category} · ₹{expense.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              title="Download bill / receipt image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Top Quick Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs font-mono-tabular">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Bill / Voucher #</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {expense.billNumber || `VCH-${expense.id}`}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Payment Mode</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{expense.paymentMode}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Amount Paid</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{expense.amount.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Faculty Coordinator</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                {expense.paidByFaculty}
              </span>
            </div>
          </div>

          {/* Rejection Notice Banner (Visible to all when rejected) */}
          {expense.billVerification === 'Rejected' && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <X className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  Bill Rejected by Accounts
                </span>
                {expense.rejectedAt && (
                  <span className="text-[10px] text-rose-500 font-mono">
                    {new Date(expense.rejectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              <p className="text-rose-900 dark:text-rose-200 font-medium">
                <strong>Audit Remark:</strong> {expense.rejectionRemark || 'No specific remark recorded.'}
              </p>
              {expense.rejectedBy && (
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                  Audited by: {expense.rejectedBy}
                </p>
              )}
            </div>
          )}

          {/* Verification Bar for Accounts Admin */}
          {isAdmin && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Accounts Audit Action</span>
                  <div className="text-xs font-semibold mt-0.5">
                    Current status: <span className={expense.billVerification === 'Verified' ? 'text-emerald-600 font-bold' : expense.billVerification === 'Rejected' ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>{expense.billVerification || 'Pending'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRejectForm(prev => !prev);
                      setRejectionRemark(expense.rejectionRemark || '');
                      setRejectError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      showRejectForm
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    {expense.billVerification === 'Rejected' ? 'Edit Rejection Remark' : 'Reject Bill with Remark'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      onVerify?.(expense.id, 'Verified');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    Verify Bill
                  </button>
                </div>
              </div>

              {/* Rejection Remark Input Form */}
              {showRejectForm && (
                <div className="pt-3 border-t border-rose-200 dark:border-rose-900/40 space-y-2 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg">
                  <label className="block text-xs font-bold text-rose-900 dark:text-rose-200">
                    Enter Rejection Remark <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionRemark}
                    onChange={e => {
                      setRejectionRemark(e.target.value);
                      if (e.target.value.trim()) setRejectError('');
                    }}
                    placeholder="Provide clear reason to faculty (e.g., Unclear bill image, tax breakdown missing, duplicate claim)"
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {rejectError && (
                    <p className="text-[11px] font-semibold text-rose-600">{rejectError}</p>
                  )}
                  {/* Preset Remark Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Illegible / blurry receipt photo',
                      'Missing vendor GST / tax memo',
                      'Amount claimed exceeds bill invoice',
                      'Missing itemized particulars',
                      'Duplicate bill submission',
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectionRemark(preset)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-rose-400 transition"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!rejectionRemark.trim()) {
                          setRejectError('A remark is required when rejecting a bill.');
                          return;
                        }
                        onVerify?.(expense.id, 'Rejected', rejectionRemark.trim());
                        setShowRejectForm(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attach proofs button in modal */}
          {onAttachProof && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 p-3 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-500 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition">
                <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{uploading ? 'Uploading…' : 'Attach Bill Photo'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => handleFileAttach(e, 'bill')}
                />
              </label>

              {expense.paymentMode === 'UPI / online' && (
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-500 cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition">
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{uploading ? 'Uploading…' : 'Attach UPI Screenshot'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleFileAttach(e, 'upi')}
                  />
                </label>
              )}
            </div>
          )}

          {/* Description */}
          {expense.description && (
            <div className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/60 font-mono-tabular">
              <span className="text-zinc-400 font-bold uppercase text-[10px] block mb-0.5">
                Particulars / Narration
              </span>
              {expense.description}
            </div>
          )}

          {/* Multi-attachment pills */}
          {expense.attachments && expense.attachments.length > 1 && (
            <div className="space-y-1.5 font-mono-tabular">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                Select Uploaded Proof ({expense.attachments.length} files attached):
              </span>
              <div className="flex flex-wrap gap-2">
                {expense.attachments.map((att, idx) => (
                  <button
                    key={att.id}
                    onClick={() => setSelectedAttIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                      selectedAttIdx === idx
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{att.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill Visual View Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{activeAttachment ? activeAttachment.name : 'Uploaded Bill / Voucher Image'}</span>
              </h4>
              <button
                onClick={handleDownload}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download This Image
              </button>
            </div>

            <div className="relative group rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 p-3 sm:p-4 flex items-center justify-center min-h-[380px] max-h-[520px] overflow-hidden shadow-inner">
              <img
                src={previewUrl}
                alt={`Bill proof for ${expense.vendor}`}
                className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-md border border-zinc-300 dark:border-zinc-700 bg-white"
              />
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-900/85 hover:bg-zinc-900 text-white text-xs font-semibold backdrop-blur-sm shadow flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attached Files List */}
          {expense.attachments && expense.attachments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Attached Files ({expense.attachments.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {expense.attachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                      selectedAttIdx === idx
                        ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/30'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedAttIdx(idx)}
                      className="flex items-center gap-2 truncate text-left hover:text-emerald-600 transition"
                    >
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {att.name}
                      </span>
                    </button>
                    <button
                      onClick={() => downloadExpenseBill(expense, att)}
                      className="p-1 rounded-lg text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shrink-0 ml-2"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
