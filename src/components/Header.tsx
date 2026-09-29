import React from 'react';
import { FacultyCoordinator, ImmersionCamp } from '../types';
import { MapPin, Plus, ExternalLink, Sun, Moon, LogOut } from 'lucide-react';

interface HeaderProps {
  faculty: FacultyCoordinator;
  immersion: ImmersionCamp;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  isOnline: boolean;
  onOpenImmersionModal: () => void;
  onOpenAuthModal: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  canAddExpense?: boolean;
  accountsScreen?: string;
  isAdmin?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  immersion,
  activeScreen,
  setActiveScreen,
  isOnline,
  onOpenImmersionModal,
  theme,
  onToggleTheme,
  canAddExpense = true,
  accountsScreen = 'statement',
  isAdmin = false,
  onLogout,
}) => {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md select-none sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="relative cursor-pointer"
              onClick={() => setActiveScreen('dashboard')}
              title="RUIP Expense Tracker"
            >
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-br from-[#f5dc88] via-[#c59a2f] to-[#8b6012] shadow-sm shrink-0">
                <img
                  src="/icon.svg"
                  alt="MIT-WPU Seal"
                  className="w-full h-full rounded-full object-contain bg-white"
                />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                title={isOnline ? 'Online mode' : 'Offline mode'}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-heading">
                  {isAdmin ? 'RUIP Accounts Console' : 'MIT-WPU Rural Immersion'}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono-tabular font-semibold rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {isAdmin ? 'Accounts Admin' : immersion.academicYear}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono-tabular font-semibold rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60" title="Connected to Firebase Firestore Project ruip-expense-tracker---mitwpu">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Firebase</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono-tabular">
                <button
                  onClick={onOpenImmersionModal}
                  className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                  title="Edit immersion camp info"
                >
                  <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {immersion.village}
                  </span>
                  <span>({immersion.district})</span>
                </button>
                <span>·</span>
                <span>{immersion.totalDays} Days Camp</span>
                <span>·</span>
                <span>{immersion.totalStudents} Students</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {canAddExpense && (
              <button
                onClick={() => setActiveScreen('add')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeScreen === 'add'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bill</span>
              </button>
            )}

            <button
              onClick={() => setActiveScreen(accountsScreen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                activeScreen === accountsScreen
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span>{accountsScreen === 'admin-statements' ? 'Accounts' : 'Statement'}</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-rose-200 hover:text-rose-600 dark:hover:border-rose-900"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
