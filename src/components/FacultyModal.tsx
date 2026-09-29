import React, { useState } from 'react';
import { FacultyCoordinator } from '../types';
import { FACULTY_ROSTER } from '../services/storage';
import { ShieldCheck, X, Users, Mail } from 'lucide-react';

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: FacultyCoordinator;
  onSaveFaculty: (faculty: FacultyCoordinator) => void;
}

export const FacultyModal: React.FC<FacultyModalProps> = ({
  isOpen,
  onClose,
  faculty,
  onSaveFaculty,
}) => {
  const [formData, setFormData] = useState<FacultyCoordinator>(faculty);
  const [emailError, setEmailError] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (val: string) => {
    const clean = val.trim().toLowerCase();
    return clean.endsWith('@mitwpu.edu.in') || clean.endsWith('@mit.edu') || clean.includes('@mit');
  };

  const handleEmailChange = (val: string) => {
    setFormData(prev => ({ ...prev, email: val }));
    if (!val) {
      setEmailError('Official MIT email is required');
    } else if (!validateEmail(val)) {
      setEmailError('Please enter your official institutional email (e.g. name@mitwpu.edu.in)');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid official MIT email ID');
      return;
    }

    const initials = formData.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');

    const updated = {
      ...formData,
      avatarInitials: initials || 'FP',
    };

    onSaveFaculty(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 400);
  };

  const selectRosterMember = (m: FacultyCoordinator) => {
    setFormData(m);
    setEmailError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Faculty Coordinator Profile
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Institutional credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Roster Selector */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-2.5 font-medium">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Select active faculty member:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FACULTY_ROSTER.map(f => {
              const isSelected = formData.email === f.email;
              return (
                <button
                  key={f.email}
                  type="button"
                  onClick={() => selectRosterMember(f)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 font-mono-tabular">
                    {f.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                      {f.designation}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              MIT-WPU Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={formData.email}
                onChange={e => handleEmailChange(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
                required
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">{emailError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono-tabular"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              {saved ? 'Saved!' : 'Save Coordinator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
