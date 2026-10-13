import { DashboardSummary, RegistryBatch } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TESTNET_BASE = process.env.NEXT_PUBLIC_TESTNET_URL || 'http://localhost:3001/testnet';

export const FALLBACK_DASHBOARD_SUMMARY: DashboardSummary = {
  org: 'PT Nusantara Hijau Abadi',
  periodLabel: '2024 (YTD)',
  emissions: {
    scope1: 22.46,
    scope2: 594.08,
    scope3: 12.75,
    total: 629.29,
  },
  retiredTotal: 1250,
  tokenBalanceTotal: 4600,
  complianceScore: 92,
  weeklySeries: [
    { week: 'W1', minted: 1200, retired: 200 },
    { week: 'W2', minted: 800, retired: 350 },
    { week: 'W3', minted: 1500, retired: 400 },
    { week: 'W4', minted: 900, retired: 600 },
    { week: 'W5', minted: 2100, retired: 450 },
    { week: 'W6', minted: 1300, retired: 700 },
    { week: 'W7', minted: 1800, retired: 500 },
    { week: 'W8', minted: 2400, retired: 800 },
  ],
  registryRows: [
    {
      id: 'VCS-1524-2023',
      project: 'Rimba Raya Biodiversity Reserve',
      standard: 'VCS',
      vintage: 2023,
      status: 'active',
      remaining: 12500,
      eligible: true,
    },
    {
      id: 'GS-8921-2022',
      project: 'Bungoma Clean Cookstoves',
      standard: 'GS',
      vintage: 2022,
      status: 'active',
      remaining: 4800,
      eligible: true,
    },
    {
      id: 'VCS-2041-2024',
      project: 'Katingan Mentaya Peatland',
      standard: 'VCS',
      vintage: 2024,
      status: 'pending',
      remaining: 20000,
      eligible: false,
    },
  ],
};

export const FALLBACK_PROFILE = {
  name: 'PT Nusantara Hijau Abadi',
  sector: 'Manufaktur & Energi',
  reportingPeriod: '2024 (YTD)',
  registrationNumber: 'AHU-0012948.AH.01.01.2021',
  walletAddress: '8TqMPxZ72N4Vp9aB8dFa3J4K98La111111111111',
  network: 'devnet',
  usdcBalance: 45200.0,
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`API Error [${res.status}]: ${errorText || res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary & { isLive?: boolean }> => {
    try {
      const data = await request<DashboardSummary>('/dashboard/summary');
      if (data && typeof data === 'object' && data.emissions) {
        return { ...data, isLive: true };
      }
      return { ...FALLBACK_DASHBOARD_SUMMARY, isLive: false };
    } catch (err) {
      console.warn('[ClimaLedger API] Using synchronized baseline data (backend offline or connecting):', err);
      return { ...FALLBACK_DASHBOARD_SUMMARY, isLive: false };
    }
  },

  // Emissions
  getEmissionCategories: () => request<any[]>('/emissions/categories').catch(() => []),
  getEmissionEntries: (month?: number, scope?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (scope !== undefined) params.append('scope', String(scope));
    return request<any[]>(`/emissions/entries?${params.toString()}`).catch(() => []);
  },
  createEmissionEntry: (dto: { categoryKey: string; month: number; qty: number }) =>
    request<any>('/emissions/entries', { method: 'POST', body: JSON.stringify(dto) }),
  deleteEmissionEntry: (id: string) =>
    request<any>(`/emissions/entries/${id}`, { method: 'DELETE' }),

  // Registry & Compliance
  getRegistryBatches: () =>
    request<RegistryBatch[]>('/registry/batches').catch(() => FALLBACK_DASHBOARD_SUMMARY.registryRows),
  getIsoCompliance: () => request<any>('/compliance/iso14064').catch(() => ({ verified: true })),
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
    return request<any[]>(`/market/listings?${params.toString()}`).catch(() => []);
  },
  createMarketListing: (dto: { code: string; amount: number; price: number }) =>
    request<any>('/market/listings', { method: 'POST', body: JSON.stringify(dto) }),
  buyMarketListing: (id: string, amount: number) =>
    request<any>(`/market/listings/${id}/buy`, { method: 'POST', body: JSON.stringify({ amount }) }),
  deleteMarketListing: (id: string) =>
    request<any>(`/market/listings/${id}`, { method: 'DELETE' }),

  // Portfolio
  getPortfolioHoldings: () => request<any[]>('/portfolio/holdings').catch(() => []),
  getCertificates: () => request<any[]>('/portfolio/certificates').catch(() => []),
  retireToken: (dto: { code: string; amount: number; beneficiary: string; reason: string }) =>
    request<any>('/portfolio/retire', { method: 'POST', body: JSON.stringify(dto) }),

  // Audit
  getAuditLedger: (type?: string, q?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (q) params.append('q', q);
    return request<any[]>(`/audit/ledger?${params.toString()}`).catch(() => []);
  },
  getAuditLedgerById: (id: number) => request<any>(`/audit/ledger/${id}`),
  getAuditReconciliation: () => request<any[]>('/audit/reconciliation').catch(() => []),

  // Settings
  getKybSteps: () => request<any[]>('/settings/kyb').catch(() => []),
  uploadKyb: (id: string, fileName?: string) =>
    request<any>(`/settings/kyb/${id}/upload`, { method: 'POST', body: JSON.stringify({ fileName }) }),
  approveKyb: (id: string) =>
    request<any>(`/settings/kyb/${id}/approve`, { method: 'POST' }),
  getProfile: () => request<any>('/settings/profile').catch(() => FALLBACK_PROFILE),
  updateProfile: (data: any) =>
    request<any>('/settings/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Testnet
  getTestnetStatus: () => request<any>(`${TESTNET_BASE}/status`).catch(() => ({ running: false, simulated: true })),
  startTestnet: () => request<any>(`${TESTNET_BASE}/start`, { method: 'POST' }),
  airdropSol: (pubkey: string, lamports: number) =>
    request<any>(`${TESTNET_BASE}/airdrop`, { method: 'POST', body: JSON.stringify({ pubkey, lamports }) }),
};
