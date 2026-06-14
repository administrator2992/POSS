import { dbService } from './DatabaseService';

const SUPABASE_FUNCTION_URL = process.env.REACT_APP_DANA_FUNCTION_URL || '';
const LOCAL_API_URL = process.env.REACT_APP_DANA_API_URL || 'http://localhost:4000/api/dana';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * Retrieve the active DANA API base URL.
 * First checks database settings (configured via Settings UI) and falls back to environment variables.
 */
async function getApiBase(): Promise<string> {
  try {
    const settings = await dbService.getSettings();
    if (settings?.payments?.danaEnabled && settings?.payments?.danaBackendUrl) {
      return settings.payments.danaBackendUrl.replace(/\/+$/, '');
    }
  } catch (error) {
    console.warn('Failed to retrieve DANA backend URL from settings, using env default:', error);
  }
  const envUrl = SUPABASE_FUNCTION_URL || LOCAL_API_URL;
  return envUrl.replace(/\/+$/, '');
}

/**
 * Build request headers, including Supabase anon key if calling a Supabase Edge Function.
 */
function buildHeaders(apiBase: string, json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  
  const isSupabase = apiBase.includes('.supabase.co') || apiBase.includes('.supabase.net');
  if (isSupabase && SUPABASE_ANON_KEY) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    headers['apikey'] = SUPABASE_ANON_KEY;
  }
  return headers;
}

export interface QrisOrder {
  success: boolean;
  referenceNo: string;
  checkoutUrl: string | null;
  qrContent: string | null;
  acquirementId: string | null;
  error?: string;
}

export interface QrisStatus {
  success: boolean;
  referenceNo: string;
  status: string;
  paid: boolean;
  error?: string;
}

/**
 * Create a QRIS payment order.
 */
export async function createQrisOrder(
  amount: number,
  orderId: string,
  items: Array<{ id?: string; name: string; price: number; quantity: number; category?: string }>
): Promise<QrisOrder> {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/create-qris`, {
    method: 'POST',
    headers: buildHeaders(apiBase),
    body: JSON.stringify({ amount, orderId, items }),
  });
  return res.json();
}

/**
 * Poll the payment status of a QRIS order.
 */
export async function getQrisStatus(referenceNo: string): Promise<QrisStatus> {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/status/${encodeURIComponent(referenceNo)}`, {
    headers: buildHeaders(apiBase, false),
  });
  return res.json();
}

/**
 * Cancel a pending QRIS order.
 */
export async function cancelQrisOrder(referenceNo: string): Promise<{ success: boolean; error?: string }> {
  const apiBase = await getApiBase();
  const res = await fetch(`${apiBase}/cancel`, {
    method: 'POST',
    headers: buildHeaders(apiBase),
    body: JSON.stringify({ referenceNo }),
  });
  return res.json();
}

/**
 * Health check — test connection to the backend.
 */
export async function checkDanaBackend(): Promise<{
  ok: boolean;
  env?: string;
  partnerId?: string;
  hasPrivateKey?: boolean;
  error?: string;
}> {
  try {
    const apiBase = await getApiBase();
    const res = await fetch(`${apiBase}/health`, {
      headers: buildHeaders(apiBase, false),
    });
    const data = await res.json();
    return { ok: data.status === 'ok', ...data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Connection failed' };
  }
}

/**
 * Poll until payment is confirmed or timeout.
 */
export async function pollQrisPayment(
  referenceNo: string,
  intervalMs = 3000,
  timeoutMs = 15 * 60 * 1000,
  onStatusUpdate?: (status: QrisStatus) => void
): Promise<QrisStatus> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const status = await getQrisStatus(referenceNo);

    if (onStatusUpdate) onStatusUpdate(status);

    if (status.paid) return status;
    if (status.status === 'CANCELLED' || status.status === 'CLOSED') return status;

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return { success: false, referenceNo, status: 'TIMEOUT', paid: false };
}
