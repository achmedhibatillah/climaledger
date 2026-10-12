export interface DashboardSummary {
  org: string;
  periodLabel: string;
  emissions: {
    scope1: number;
    scope2: number;
    scope3: number;
    total: number;
  };
  retiredTotal: number;
  tokenBalanceTotal: number;
  complianceScore: number;
  weeklySeries: {
    week: string;
    minted: number;
    retired: number;
  }[];
  registryRows: RegistryBatch[];
}

export interface RegistryBatch {
  id: string;
  project: string;
  standard: 'VCS' | 'GS';
  vintage: number;
  status: 'active' | 'pending';
  remaining: number;
  eligible: boolean;
}

export interface EmissionCategory {
  key: string;
  nameId: string;
  nameEn: string;
  scope: 1 | 2 | 3;
  unitId: string;
  unitEn: string;
  factor: number;
}

export interface EmissionEntry {
  id: string;
  month: number;
  categoryKey: string;
  qty: number;
}

export interface MarketListing {
  id: string;
  code: string;
  project: string;
  standard: 'VCS' | 'GS';
  vintage: number;
  available: number;
  price: number;
  seller: string;
  mine: boolean;
}

export interface Holding {
  code: string;
  project: string;
  standard: 'VCS' | 'GS';
  vintage: number;
  balance: number;
  listed: number;
  retired: number;
}

export interface RetirementCert {
  id: number;
  code: string;
  amount: number;
  beneficiary: string;
  reason: string;
  sig: string;
  slot: number;
  time: string;
}

export interface LedgerEvent {
  id: number;
  type: 'Mint' | 'Pembelian' | 'Listing' | 'Retirement' | 'Attestation' | 'Pembatalan';
  code: string;
  amount: number;
  sig: string;
  slot: number;
  time: string;
  signer: string;
  fee: number;
  cu: number;
  mint?: string;
  ata?: string;
  memo?: string;
}

export interface KybStep {
  id: string;
  name: string;
  detail: string;
  status: 'verified' | 'pending' | 'missing';
  file?: string;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  reportingPeriod: string;
  registrationNumber: string;
  walletAddress: string;
  network: string;
  usdcBalance: number;
}

