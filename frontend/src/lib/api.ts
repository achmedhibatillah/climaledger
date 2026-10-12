const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TESTNET_BASE = process.env.NEXT_PUBLIC_TESTNET_URL || 'http://localhost:3001/testnet';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),

  // Emissions
  getEmissionCategories: () => request<any[]>('/emissions/categories'),
  getEmissionEntries: (month?: number, scope?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (scope !== undefined) params.append('scope', String(scope));
    return request<any[]>(`/emissions/entries?${params.toString()}`);
  },
  createEmissionEntry: (dto: { categoryKey: string; month: number; qty: number }) =>
    request<any>('/emissions/entries', { method: 'POST', body: JSON.stringify(dto) }),
  deleteEmissionEntry: (id: string) =>
    request<any>(`/emissions/entries/${id}`, { method: 'DELETE' }),

  // Registry & Compliance
  getRegistryBatches: () => request<any[]>('/registry/batches'),
  getIsoCompliance: () => request<any>('/compliance/iso14064'),
  updateOffsetPlan: (amount: number) =>
    request<any>('/compliance/offset-plan', { method: 'PUT', body: JSON.stringify({ amount }) }),

  // Tokenize
  createLockJob: (batchId: string, amount: number) =>
    request<{ jobId: string }>('/tokenize/lock', { method: 'POST', body: JSON.stringify({ batchId, amount }) }),
  processMint: (jobId: string, walletSignature?: string) =>
    request<any>('/tokenize/mint', { method: 'POST', body: JSON.stringify({ jobId, walletSignature }) }),
  getJob: (jobId: string) => request<any>(`/tokenize/job/${jobId}`),
  cancelLock: (jobId: string) => request<any>(`/tokenize/lock/${jobId}`, { method: 'DELETE' }),

  // Market
  getMarketListings: (std?: string, q?: string, sort?: string) => {
    const params = new URLSearchParams();
    if (std) params.append('std', std);
    if (q) params.append('q', q);
    if (sort) params.append('sort', sort);
    return request<any[]>(`/market/listings?${params.toString()}`);
  },
  createMarketListing: (dto: { code: string; amount: number; price: number }) =>
    request<any>('/market/listings', { method: 'POST', body: JSON.stringify(dto) }),
  buyMarketListing: (id: string, amount: number) =>
    request<any>(`/market/listings/${id}/buy`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteMarketListing: (id: string) =>
    request<any>(`/market/listings/${id}`, { method: 'DELETE' }),

  // Portfolio
  getPortfolioHoldings: () => request<any[]>('/portfolio/holdings'),
  getCertificates: () => request<any[]>('/portfolio/certificates'),
  retireToken: (dto: { code: string; amount: number; beneficiary: string; reason: string }) =>
    request<any>('/portfolio/retire', { method: 'POST', body: JSON.stringify(dto) }),

  // Audit
  getAuditLedger: (type?: string, q?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (q) params.append('q', q);
    return request<any[]>(`/audit/ledger?${params.toString()}`);
  },
  getAuditLedgerById: (id: number) => request<any>(`/audit/ledger/${id}`),
  getAuditReconciliation: () => request<any[]>('/audit/reconciliation'),

  // Settings
  getKybSteps: () => request<any[]>('/settings/kyb'),
  uploadKyb: (id: string, fileName?: string) =>
    request<any>(`/settings/kyb/${id}/upload`, { method: 'POST', body: JSON.stringify({ fileName }) }),
  approveKyb: (id: string) =>
    request<any>(`/settings/kyb/${id}/approve`, { method: 'POST' }),
  getProfile: () => request<any>('/settings/profile'),
  updateProfile: (data: any) =>
    request<any>('/settings/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Testnet
  getTestnetStatus: () => request<any>(`${TESTNET_BASE}/status`),
  startTestnet: () => request<any>(`${TESTNET_BASE}/start`, { method: 'POST' }),
  airdropSol: (pubkey: string, lamports: number) =>
    request<any>(`${TESTNET_BASE}/airdrop`, { method: 'POST', body: JSON.stringify({ pubkey, lamports }) }),
};

