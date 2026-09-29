import React, { useState, useEffect } from 'react';
import { Expense, ImmersionCamp } from '../types';
import {
  ChartPie,
  TrendingUp,
  Users,
  ChartColumn,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Flame,
  FileDown,
  Server,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  checkFastApiHealth,
  getAnalyticsSummary,
  getForecast,
  getCompliance,
  exportSettlementStatement,
  buildExpensePayload,
  AnalyticsSummaryResponse,
  ForecastData,
  ComplianceItem,
} from '../services/ruipApi';

interface AnalyticsProps {
  expenses: Expense[];
  immersion: ImmersionCamp;
}

const PALETTE = [
  '#059669', // emerald
  '#0284c7', // sky
  '#d97706', // amber
  '#7c3aed', // purple
  '#db2777', // pink
  '#2563eb', // blue
  '#ea580c', // orange
  '#0d9488', // teal
  '#4f46e5', // indigo
  '#64748b', // slate
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(x: number, y: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) {
  const deltaAngle = endAngle - startAngle;
  let safeEndAngle = endAngle;
  if (deltaAngle >= 359.99) {
    safeEndAngle = startAngle + 359.99;
  }

  const startOuter = polarToCartesian(x, y, outerRadius, safeEndAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, safeEndAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = deltaAngle <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

export const Analytics: React.FC<AnalyticsProps> = ({ expenses, immersion }) => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // Python Backend Integration State
  const [pythonStatus, setPythonStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [backendSummary, setBackendSummary] = useState<AnalyticsSummaryResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [complianceList, setComplianceList] = useState<ComplianceItem[] | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sync with FastAPI whenever expenses or immersion changes
  useEffect(() => {
    let isCancelled = false;

    async function syncBackend() {
      setPythonStatus('checking');
      const payload = buildExpensePayload(expenses, immersion);

      try {
        const health = await checkFastApiHealth();
        if (isCancelled) return;

        if (!health.online) {
          setPythonStatus('offline');
          return;
        }

        setPythonStatus('connected');

        // Fetch summary, forecast, and compliance in parallel
        const [sumRes, fcRes, compRes] = await Promise.allSettled([
          getAnalyticsSummary(payload),
          getForecast(payload),
          getCompliance(payload),
        ]);

        if (isCancelled) return;

        if (sumRes.status === 'fulfilled') {
          setBackendSummary(sumRes.value);
        }
        if (fcRes.status === 'fulfilled') {
          setForecastData(fcRes.value.forecast);
        }
        if (compRes.status === 'fulfilled') {
          setComplianceList(compRes.value.flagged);
        }
      } catch (err) {
        if (!isCancelled) {
          setPythonStatus('offline');
        }
      }
    }

    syncBackend();

    return () => {
      isCancelled = true;
    };
  }, [expenses, immersion]);

  // Local fallback calculations ensure UI never breaks even if Python server is unreachable
  const totalSpent = backendSummary?.statistics?.total_amount ?? expenses.reduce((s, e) => s + e.amount, 0);
  const advance = immersion.advanceReceived || 0;
  const balance = advance - totalSpent;
  const utilization = advance > 0 ? (totalSpent / advance) * 100 : 0;

  // Local forecast fallback if backend is offline
  const daysElapsed = Math.max(1, immersion.currentDay || 1);
  const totalCampDays = Math.max(1, immersion.totalDays || 7);
  const remainingDays = Math.max(0, totalCampDays - daysElapsed);
  const localBurnRate = Math.round((totalSpent / daysElapsed) * 100) / 100;
  const localProjectedTotal = Math.round(localBurnRate * totalCampDays);
  const localProjectedBalance = advance - localProjectedTotal;
  const localDailyCap = remainingDays > 0 && balance > 0 ? Math.round(balance / remainingDays) : 0;

  const activeForecast: ForecastData = forecastData || {
    total_spent_so_far: totalSpent,
    advance_amount: advance,
    days_elapsed: daysElapsed,
    total_camp_days: totalCampDays,
    remaining_days: remainingDays,
    daily_burn_rate: localBurnRate,
    projected_total_expense: localProjectedTotal,
    projected_final_balance: localProjectedBalance,
    advance_utilization_pct: Math.round(utilization * 10) / 10,
    status: localProjectedBalance < 0 ? 'DEFICIT_PROJECTED' : 'WITHIN_BUDGET',
    recommended_daily_cap_remaining: localDailyCap,
  };

  // Local compliance fallback if backend is offline
  const localComplianceList: ComplianceItem[] = complianceList || (() => {
    const flagged: ComplianceItem[] = [];
    expenses.forEach(e => {
      if (e.amount >= 10000) {
        flagged.push({
          expense_id: e.id,
          vendor: e.vendor,
          amount: e.amount,
          type: 'HIGH_VALUE',
          message: `Claim of ₹${e.amount.toLocaleString('en-IN')} exceeds ₹10,000 threshold. Itemized invoice required.`,
        });
      }
      if (e.paymentMode === 'Cash' && e.amount > 5000) {
        flagged.push({
          expense_id: e.id,
          vendor: e.vendor,
          amount: e.amount,
          type: 'CASH_LIMIT_EXCEEDED',
          message: `Cash payment of ₹${e.amount.toLocaleString('en-IN')} exceeds policy ceiling (₹5,000).`,
        });
      }
      if (!e.hasBillProof && (!e.attachments || e.attachments.length === 0)) {
        flagged.push({
          expense_id: e.id,
          vendor: e.vendor,
          amount: e.amount,
          type: 'MISSING_PROOF',
          message: `Transaction of ₹${e.amount.toLocaleString('en-IN')} has no bill attachment.`,
        });
      }
    });
    return flagged;
  })();

  // Aggregate by category
  const catMap: Record<string, { amount: number; count: number }> = {};
  expenses.forEach(e => {
    if (!catMap[e.category]) {
      catMap[e.category] = { amount: 0, count: 0 };
    }
    catMap[e.category].amount += e.amount;
    catMap[e.category].count += 1;
  });

  const categories = Object.entries(catMap)
    .map(([cat, val], idx) => ({
      category: cat,
      amount: val.amount,
      count: val.count,
      percentage: totalSpent > 0 ? (val.amount / totalSpent) * 100 : 0,
      color: PALETTE[idx % PALETTE.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  let currentAngle = 0;
  const slices = categories.map(c => {
    const sliceAngle = totalSpent > 0 ? (c.amount / totalSpent) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle += sliceAngle;
    return {
      ...c,
      startAngle,
      endAngle,
      path: describeArc(150, 150, 120, 72, startAngle, endAngle),
      expandedPath: describeArc(150, 150, 126, 68, startAngle, endAngle),
    };
  });

  // Aggregate by payment mode
  const modeMap: Record<string, number> = {};
  expenses.forEach(e => {
    modeMap[e.paymentMode] = (modeMap[e.paymentMode] || 0) + e.amount;
  });

  // Aggregate by date
  const dateMap: Record<string, number> = {};
  expenses.forEach(e => {
    dateMap[e.date] = (dateMap[e.date] || 0) + e.amount;
  });
  const sortedDates = Object.keys(dateMap).sort();
  const maxDaily = Math.max(...Object.values(dateMap), 1);

  const activeCatName = hoveredCat || selectedCat;
  const activeCat = activeCatName ? categories.find(c => c.category === activeCatName) : null;
  const costPerStudent = immersion.totalStudents > 0 ? totalSpent / immersion.totalStudents : 0;

  const handleExportStatementPdf = async () => {
    try {
      setExportingPdf(true);
      setExportNotice(null);
      const payload = buildExpensePayload(expenses, immersion);
      const { filename } = await exportSettlementStatement(payload);
      setExportNotice(`Downloaded ${filename} successfully!`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err: any) {
      console.warn('PDF Export fallback note:', err?.message || err);
      setExportNotice('Generated official statement. Opening printable report...');
      setTimeout(() => {
        window.print();
        setExportNotice(null);
      }, 500);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <ChartPie className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-heading">
              Spend Analytics &amp; Breakdown
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono-tabular">
            Visual expenditure distribution, category shares, and settlement metrics for {immersion.village}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono-tabular">
          {/* Small unobtrusive Python Status Indicator */}
          {pythonStatus === 'checking' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500">
              <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
              <span>Checking Python...</span>
            </div>
          )}

          {pythonStatus === 'connected' && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
              title="FastAPI Python engine is live. Processing real-time burn-rate forecasts and audit compliance."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Python Connected</span>
            </div>
          )}

          {pythonStatus === 'offline' && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-medium"
              title="FastAPI server offline. Seamlessly utilizing local financial calculations."
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>Python Offline</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs">
            <span className="text-zinc-400 mr-1.5">Advance:</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              ₹{advance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>₹{totalSpent.toLocaleString('en-IN')} Spent</span>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportStatementPdf}
            disabled={exportingPdf}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            title="Generate and download official PDF settlement register from Python backend"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{exportingPdf ? 'Exporting PDF...' : 'Download Statement PDF'}</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between font-mono-tabular">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-xs text-emerald-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono-tabular">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Advance Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {utilization.toFixed(1)}%
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {utilization > 100
              ? `Exceeded advance by ₹${Math.abs(balance).toLocaleString('en-IN')}`
              : `₹${balance.toLocaleString('en-IN')} unspent advance`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Cost Per Student</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            ₹{Math.round(costPerStudent).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Based on {immersion.totalStudents} participating students
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Top Category</span>
            <ChartPie className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 truncate">
            {categories[0]?.category || 'None'}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            ₹{categories[0]?.amount.toLocaleString('en-IN')} ({categories[0]?.percentage.toFixed(1)}%)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Total Vouchers</span>
            <ChartColumn className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {expenses.length} Bills
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Across {sortedDates.length} camp dates
          </div>
        </div>
      </div>

      {/* Python Forecast & Policy Compliance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono-tabular">
        {/* Forecast Card (FastAPI) */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-heading">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Budget Burn-Rate &amp; Trip Forecast</span>
            </h3>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${
                activeForecast.status === 'WITHIN_BUDGET'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              }`}
            >
              {activeForecast.status === 'WITHIN_BUDGET' ? 'Within Budget' : 'Deficit Projected'}
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pacing projection computed for day {activeForecast.days_elapsed} of {activeForecast.total_camp_days} (
            {activeForecast.remaining_days} days remaining).
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Daily Burn Rate</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ₹{Math.round(activeForecast.daily_burn_rate).toLocaleString('en-IN')}/day
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Projected Total</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ₹{Math.round(activeForecast.projected_total_expense).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Projected Final Balance</span>
              <span
                className={`text-lg font-bold ${
                  activeForecast.projected_final_balance >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                ₹{Math.round(activeForecast.projected_final_balance).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-400 block">Recommended Cap</span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ₹{Math.round(activeForecast.recommended_daily_cap_remaining).toLocaleString('en-IN')}/day
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Card (FastAPI) */}
        <div className="lg:col-span-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-heading">
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Finance Policy &amp; Audit Compliance</span>
            </h3>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${
                localComplianceList.length === 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
              }`}
            >
              {localComplianceList.length === 0 ? '100% Compliant' : `${localComplianceList.length} Flagged`}
            </span>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Automated scrutiny against MIT-WPU cash disbursement limits (₹5,000 max cash) and itemized receipt mandates.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {localComplianceList.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-800 dark:text-emerald-200">
                  <p className="font-semibold">All submitted claims conform to University accounting norms.</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    No cash limits breached and all high-value transactions have valid vouchers.
                  </p>
                </div>
              </div>
            ) : (
              localComplianceList.map((item, idx) => (
                <div
                  key={`${item.expense_id}-${item.type}-${idx}`}
                  className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {item.expense_id} · {item.vendor}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300 text-[11px]">
                    <span>{item.message}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0 pl-2">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SVG Donut / Pie Chart & Categories */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-heading">
              <ChartPie className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Expenditure Pie Chart</span>
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono-tabular">
              Hover or click slices to inspect
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 shrink-0">
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full transform -rotate-90 filter drop-shadow-sm transition-all duration-300"
              >
                {slices.map(s => {
                  const isHovered = hoveredCat === s.category;
                  const isSelected = selectedCat === s.category;
                  const active = isHovered || isSelected;
                  return (
                    <path
                      key={s.category}
                      d={active ? s.expandedPath : s.path}
                      fill={s.color}
                      stroke={active ? '#ffffff' : 'transparent'}
                      strokeWidth={active ? 2.5 : 1}
                      onMouseEnter={() => setHoveredCat(s.category)}
                      onMouseLeave={() => setHoveredCat(null)}
                      onClick={() => setSelectedCat(selectedCat === s.category ? null : s.category)}
                      className="cursor-pointer transition-all duration-200 hover:opacity-95"
                    />
                  );
                })}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                {activeCat ? (
                  <div className="space-y-0.5 animate-in fade-in duration-200 font-mono-tabular">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block truncate max-w-[120px]">
                      {activeCat.category}
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                      ₹{activeCat.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {activeCat.percentage.toFixed(1)}% of spend
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      {activeCat.count} {activeCat.count === 1 ? 'bill' : 'bills'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5 font-mono-tabular">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Total Spent
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                      {categories.length} Categories
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="flex-1 w-full space-y-1.5 max-h-64 overflow-y-auto pr-1 font-mono-tabular">
              {categories.map(c => {
                const isSelected = selectedCat === c.category;
                const isHovered = hoveredCat === c.category;
                const active = isSelected || isHovered;
                return (
                  <div
                    key={c.category}
                    onMouseEnter={() => setHoveredCat(c.category)}
                    onMouseLeave={() => setHoveredCat(null)}
                    onClick={() => setSelectedCat(selectedCat === c.category ? null : c.category)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                      active
                        ? 'bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: c.color }} />
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{c.category}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 pl-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-zinc-400 w-10 text-right">
                        {c.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono-tabular">
              <span>Proportional Distribution</span>
              <span>100% Total</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
              {categories.map(c => (
                <div
                  key={c.category}
                  style={{ width: `${c.percentage}%`, backgroundColor: c.color }}
                  onMouseEnter={() => setHoveredCat(c.category)}
                  onMouseLeave={() => setHoveredCat(null)}
                  onClick={() => setSelectedCat(selectedCat === c.category ? null : c.category)}
                  className="h-full transition-all duration-200 cursor-pointer hover:opacity-80"
                  title={`${c.category}: ₹${c.amount.toLocaleString('en-IN')} (${c.percentage.toFixed(1)}%)`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Payment Methods & Daily Pacing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Payment Mode Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4 font-mono-tabular">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-heading">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Payment Methods</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(modeMap).map(([mode, amt]) => {
                const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
                const isCash = mode === 'Cash';
                return (
                  <div key={mode} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isCash ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                        {mode}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                        ₹{amt.toLocaleString('en-IN')} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCash ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Pacing Card */}
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4 font-mono-tabular">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 font-heading">
              <ChartColumn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Daily Spending Pacing</span>
            </h3>

            <div className="space-y-2 pt-2">
              {sortedDates.map(date => {
                const amt = dateMap[date];
                const pct = (amt / maxDaily) * 100;
                return (
                  <div key={date} className="space-y-1">
                    <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{date}</span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{amt.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
