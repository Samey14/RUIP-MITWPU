import React, { useState } from 'react';
import { FacultyCoordinator, ImmersionCamp, TripRecord } from '../types';
import {
  LayoutDashboard,
  CirclePlus,
  ReceiptText,
  ChartPie,
  FileSpreadsheet,
  ListTree,
  ShieldCheck,
  UsersRound,
  Users,
  Download,
  Sun,
  Moon,
  WifiOff,
  ChevronRight,
  ChevronDown,
  X,
  Menu,
  LogOut,
  Smartphone,
  MapPin,
  Check
} from 'lucide-react';
import { MitWpuLogo } from './MitWpuLogo';

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  isOnline: boolean;
  faculty: FacultyCoordinator;
  immersion: ImmersionCamp;
  totalSpent: number;
  expenseCount: number;
  onOpenAuthModal: () => void;
  onOpenImmersionModal: () => void;
  isInstallable: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  onInstall: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isAdmin?: boolean;
  accountName?: string;
  accountEmail?: string;
  onLogout?: () => void;
  accessibleTrips?: TripRecord[];
  selectedTripId?: string;
  onSelectTrip?: (tripId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  setActiveScreen,
  isOnline,
  faculty,
  immersion,
  totalSpent,
  expenseCount,
  onOpenAuthModal,
  onOpenImmersionModal,
  isInstallable,
  isInstalled = false,
  isIOS = false,
  onInstall,
  theme,
  onToggleTheme,
  isAdmin = false,
  accountName,
  accountEmail,
  onLogout,
  accessibleTrips = [],
  selectedTripId,
  onSelectTrip,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);

  const displayName = accountName || faculty.name;
  const displayRole = isAdmin ? accountEmail || 'Accounts Administrator' : faculty.department;
  const initials =
    displayName
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || faculty.avatarInitials;

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    ...(!isAdmin
      ? [
          { id: 'add', label: 'Add Expense', icon: <CirclePlus className="w-4 h-4" />, badge: '+ New', badgeVariant: 'accent' },
          { id: 'ledger', label: 'Expense Ledger', icon: <ReceiptText className="w-4 h-4" />, badge: expenseCount, badgeVariant: 'neutral' },
        ]
      : []),
    { id: 'analytics', label: 'Spend Analytics', icon: <ChartPie className="w-4 h-4" /> },
    ...(!isAdmin
      ? [{ id: 'statement', label: 'Accounts Statement', icon: <FileSpreadsheet className="w-4 h-4" /> }]
      : []),
    ...(isAdmin
      ? [
          { id: 'trips', label: 'Manage Trips', icon: <ListTree className="w-4 h-4" />, badge: 'Admin', badgeVariant: 'accent' },
          { id: 'admin-bills', label: 'Ledger Verification', icon: <ShieldCheck className="w-4 h-4" />, badge: expenseCount, badgeVariant: 'neutral' },
          { id: 'admin-statements', label: 'Accounts Clearance', icon: <UsersRound className="w-4 h-4" />, badge: 'Admin', badgeVariant: 'accent' },
          { id: 'admin-users', label: 'Authorized Users', icon: <Users className="w-4 h-4" />, badge: 'Access', badgeVariant: 'accent' },
        ]
      : []),
  ];

  const handleNav = (screen: string) => {
    setActiveScreen(screen);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const advance = immersion.advanceReceived || 0;
  const remaining = advance - totalSpent;
  const pct = advance > 0 ? Math.min(100, Math.round((totalSpent / advance) * 100)) : 0;
  const isDeficit = remaining < 0;

  const sidebarContent = (
    <div className="flex flex-col h-full select-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-3 text-left group focus:outline-none"
            title="RUIP Expense Tracker — MIT-WPU"
          >
            <MitWpuLogo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-heading">
                  RUIP Tracker
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wide uppercase font-mono-tabular rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  MIT-WPU
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-tabular truncate mt-0.5">
                {immersion.village} · {immersion.academicYear}
              </p>
            </div>
          </button>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Trip Selector (Only shows trips assigned to user, or all trips if admin) */}
      {accessibleTrips.length > 0 && onSelectTrip && (
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setTripDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition text-left shadow-2xs"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {isAdmin ? 'Trip Console' : 'Assigned Trip'}
                  </span>
                  {accessibleTrips.length > 1 && (
                    <span className="px-1 py-0.2 text-[9px] font-mono-tabular rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {accessibleTrips.length} available
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                  {immersion.village || 'Select Immersion Trip'}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono-tabular truncate">
                  {immersion.tripCode}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-150 ${
                  tripDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </button>

            {tripDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 max-h-56 overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] font-semibold font-mono-tabular text-zinc-400 uppercase tracking-wider">
                  {isAdmin ? 'All University Trips' : 'Your Assigned Trips'}
                </div>
                {accessibleTrips.map(trip => {
                  const isSelected = trip.id === selectedTripId;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => {
                        onSelectTrip(trip.id);
                        setTripDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 flex items-start justify-between text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-medium truncate flex items-center gap-1.5">
                          <span>{trip.village || trip.location}</span>
                          <span className="text-[10px] font-mono-tabular text-zinc-400 dark:text-zinc-500">
                            ({trip.district})
                          </span>
                        </div>
                        <div className="text-[10px] font-mono-tabular text-zinc-500 dark:text-zinc-400 truncate">
                          {trip.tripCode} · ₹{(trip.budget || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camp Advance Widget */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Camp Advance</span>
            <span className="font-mono-tabular font-bold text-zinc-900 dark:text-zinc-100">
              ₹{advance.toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono-tabular">
                Spent ({pct}%)
              </span>
              <span
                className={`font-mono-tabular font-bold text-xs ${
                  isDeficit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                ₹{remaining.toLocaleString('en-IN')} {isDeficit ? 'deficit' : 'left'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isDeficit ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] font-mono-tabular text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800/80">
            <span>Logged: ₹{totalSpent.toLocaleString('en-IN')}</span>
            <button
              onClick={onOpenImmersionModal}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {immersion.totalDays} Days Camp
            </button>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono-tabular">
          Menu
        </div>
        {menuItems.map(item => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono-tabular font-semibold rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeVariant === 'accent'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls: Theme, Online status, PWA Install & Faculty Card */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
        {/* Theme and Online Status */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
          <button
            onClick={onToggleTheme}
            className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <WifiOff className="w-3 h-3" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* PWA In-App Install Button */}
        {!isInstalled && isInstallable && (
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Install App on Device</span>
          </button>
        )}

        {!isInstalled && isIOS && !isInstallable && (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition"
          >
            <Smartphone className="w-4 h-4" />
            <span>Add to iPhone Home Screen</span>
          </button>
        )}

        {/* User Card */}
        <button
          onClick={() => !isAdmin && onOpenAuthModal()}
          disabled={isAdmin}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 enabled:hover:border-emerald-500/40 transition group text-left"
          title={isAdmin ? 'Signed in as Accounts Administrator' : 'Click to view or switch faculty'}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0 font-mono-tabular">
              {initials}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                {displayName}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono-tabular truncate">
                {displayRole}
              </p>
            </div>
          </div>
          {!isAdmin && <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 transition shrink-0" />}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono-tabular">
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">1.</span>
                <span>Tap the <strong>Share</strong> button (box with an upward arrow) in the Safari toolbar.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">2.</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-emerald-600">3.</span>
                <span>Tap <strong>Add</strong> at top right to launch RUIP Tracker full screen like a native app.</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-br from-[#f5dc88] via-[#c59a2f] to-[#8b6012] shadow-sm shrink-0">
              <img src="/icon.svg" alt="MIT-WPU Seal" className="w-full h-full rounded-full object-contain bg-white" />
            </div>
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
              RUIP Tracker
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono-tabular font-medium uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800/60">
              {immersion.village}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
          <button
            onClick={() => !isAdmin && onOpenAuthModal()}
            disabled={isAdmin}
            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold uppercase font-mono-tabular"
            title={isAdmin ? 'Accounts Administrator' : 'Faculty profile'}
          >
            {initials}
          </button>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 shrink-0 h-screen sticky top-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
