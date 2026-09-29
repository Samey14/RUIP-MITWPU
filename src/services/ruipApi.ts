/**
 * RUIP FastAPI Client Service
 * Dr. Vishwanath Karad MIT World Peace University, Pune
 * Connects the React application to the Python FastAPI backend engine
 */

import { Expense, ImmersionCamp } from '../types';

export interface ExpensePayload {
  expenses: Expense[];
  advanceReceived: number;
  totalDays: number;
  currentDay: number;
  campInfo?: {
    tripCode?: string;
    village?: string;
    district?: string;
    academicYear?: string;
    advanceReceived?: number;
    totalDays?: number;
    [key: string]: any;
  };
  coordinatorName?: string;
}

export interface AnalyticsStatistics {
  total_expenses: number;
  total_amount: number;
  advance_received: number;
  balance_remaining: number;
  is_deficit: boolean;
  average_expense: number;
  max_expense: number;
  verified_count: number;
  pending_count: number;
  rejected_count: number;
  verified_amount: number;
  pending_amount: number;
  rejected_amount: number;
  with_bill_proof_count: number;
  with_upi_proof_count: number;
}

export interface BreakdownsData {
  by_category: Record<string, { count: number; total: number }>;
  by_payment_mode: Record<string, { count: number; total: number }>;
  by_faculty: Record<string, { count: number; total: number; verified: number; pending: number; rejected: number }>;
  by_date: Record<string, { count: number; total: number }>;
}

export interface AnalyticsSummaryResponse {
  success: boolean;
  statistics: AnalyticsStatistics;
  breakdowns: BreakdownsData;
}

export interface BreakdownsResponse {
  success: boolean;
  breakdowns: BreakdownsData;
}

export interface ForecastData {
  total_spent_so_far: number;
  advance_amount: number;
  days_elapsed: number;
  total_camp_days: number;
  remaining_days: number;
  daily_burn_rate: number;
  projected_total_expense: number;
  projected_final_balance: number;
  advance_utilization_pct: number;
  status: 'DEFICIT_PROJECTED' | 'WITHIN_BUDGET';
  recommended_daily_cap_remaining: number;
}

export interface ForecastResponse {
  success: boolean;
  forecast: ForecastData;
}

export interface ComplianceItem {
  expense_id: string;
  vendor: string;
  amount: number;
  type: 'HIGH_VALUE' | 'CASH_LIMIT_EXCEEDED' | 'MISSING_PROOF';
  message: string;
}

export interface ComplianceResponse {
  success: boolean;
  count: number;
  flagged: ComplianceItem[];
}

export interface HealthCheckResponse {
  online: boolean;
  service?: string;
  institution?: string;
  status?: string;
  endpoints?: string[];
  raw?: any;
}

export const FASTAPI_BASE_URL = 'https://ruip-mitwpu.onrender.com';

/**
 * Resolves API URL directly to the deployed FastAPI backend on Render.
 * React communicates directly with the production FastAPI backend without needing a local port.
 */
export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_RUIP_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return FASTAPI_BASE_URL;
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) {
    return cleanPath;
  }
  return `${base}${cleanPath}`;
}

/**
 * Health check: Calls GET /api/health using VITE_RUIP_API_URL or same-origin /api path.
 */
export async function checkFastApiHealth(): Promise<HealthCheckResponse> {
  const targetUrl = buildUrl('/api/health');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: data?.status === 'ok' || data?.status === 'online' || !!data?.service,
        service: data?.service,
        institution: data?.institution,
        status: data?.status,
        endpoints: data?.endpoints,
        raw: data,
      };
    }
  } catch (err) {
    // Graceful offline fallback
  }

  return { online: false };
}

/**
 * POST /api/analytics/summary
 */
export async function getAnalyticsSummary(payload: ExpensePayload): Promise<AnalyticsSummaryResponse> {
  const url = buildUrl('/api/analytics/summary');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI summary request failed [${res.status}]: ${errText}`);
  }

  return res.json();
}

/**
 * POST /api/analytics/breakdowns
 */
export async function getAnalyticsBreakdowns(payload: ExpensePayload): Promise<BreakdownsResponse> {
  const url = buildUrl('/api/analytics/breakdowns');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI breakdowns request failed [${res.status}]: ${errText}`);
  }

  return res.json();
}

/**
 * POST /api/analytics/forecast
 */
export async function getForecast(payload: ExpensePayload): Promise<ForecastResponse> {
  const url = buildUrl('/api/analytics/forecast');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI forecast request failed [${res.status}]: ${errText}`);
  }

  return res.json();
}

/**
 * POST /api/analytics/compliance
 */
export async function getCompliance(payload: ExpensePayload): Promise<ComplianceResponse> {
  const url = buildUrl('/api/analytics/compliance');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI compliance request failed [${res.status}]: ${errText}`);
  }

  return res.json();
}

/**
 * POST /api/export/settlement-statement
 * Downloads genuine official settlement PDF from Python backend.
 */
export async function exportSettlementStatement(payload: ExpensePayload): Promise<{ blob: Blob; filename: string }> {
  const url = buildUrl('/api/export/settlement-statement');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`FastAPI PDF export failed [${res.status}]: ${errText}`);
  }

  // Parse filename from Content-Disposition header
  const disposition = res.headers.get('Content-Disposition') || '';
  let filename = `RUIP-Settlement-${payload.campInfo?.tripCode || 'Statement'}.pdf`;

  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match && match[1]) {
    filename = match[1].trim();
  }

  const blob = await res.blob();

  // Trigger browser download if running in client
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
  }

  return { blob, filename };
}

/**
 * Helper to construct ExpensePayload from existing immersion and expenses state
 */
export function buildExpensePayload(
  expenses: Expense[],
  immersion: ImmersionCamp,
  coordinatorName?: string
): ExpensePayload {
  return {
    expenses,
    advanceReceived: immersion.advanceReceived || 0,
    totalDays: immersion.totalDays || 7,
    currentDay: immersion.currentDay || 1,
    campInfo: {
      tripCode: immersion.tripCode,
      village: immersion.village,
      district: immersion.district,
      academicYear: immersion.academicYear,
      advanceReceived: immersion.advanceReceived,
      totalDays: immersion.totalDays,
    },
    coordinatorName: coordinatorName || immersion.coordinators?.[0] || 'Faculty Coordinator',
  };
}
