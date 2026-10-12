import { Injectable } from '@nestjs/common';

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

@Injectable()
export class InMemoryDbService {
  // 1. Registry Batches
  public registryBatches: RegistryBatch[] = [
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
  ];

  // 2. Emission Categories & Entries
  public emissionCategories: EmissionCategory[] = [
    { key: 'diesel_gen', nameId: 'Genset Diesel', nameEn: 'Diesel Generator', scope: 1, unitId: 'Liter', unitEn: 'Liters', factor: 0.00268 },
    { key: 'fleet_petrol', nameId: 'Bensin Armada', nameEn: 'Fleet Gasoline', scope: 1, unitId: 'Liter', unitEn: 'Liters', factor: 0.00231 },
    { key: 'grid_electricity', nameId: 'Listrik PLN (Jawa-Bali)', nameEn: 'Grid Electricity', scope: 2, unitId: 'kWh', unitEn: 'kWh', factor: 0.00079 },
    { key: 'business_travel', nameId: 'Perjalanan Bisnis (Penerbangan)', nameEn: 'Business Flights', scope: 3, unitId: 'pax-km', unitEn: 'pax-km', factor: 0.00015 },
    { key: 'supply_chain', nameId: 'Logistik Pihak Ketiga', nameEn: '3rd-Party Logistics', scope: 3, unitId: 'ton-km', unitEn: 'ton-km', factor: 0.00009 },
  ];

  public emissionEntries: EmissionEntry[] = [
    { id: 'entry-1', month: 1, categoryKey: 'grid_electricity', qty: 250000 },
    { id: 'entry-2', month: 1, categoryKey: 'diesel_gen', qty: 4500 },
    { id: 'entry-3', month: 2, categoryKey: 'grid_electricity', qty: 242000 },
    { id: 'entry-4', month: 2, categoryKey: 'business_travel', qty: 85000 },
    { id: 'entry-5', month: 3, categoryKey: 'grid_electricity', qty: 260000 },
  ];

  // 3. Market Listings
  public marketListings: MarketListing[] = [
    {
      id: 'list-101',
      code: 'VCS-1524-2023',
      project: 'Rimba Raya Biodiversity Reserve',
      standard: 'VCS',
      vintage: 2023,
      available: 1200,
      price: 14.5,
      seller: '7YwN...4kPL',
      mine: false,
    },
    {
      id: 'list-102',
      code: 'GS-8921-2022',
      project: 'Bungoma Clean Cookstoves',
      standard: 'GS',
      vintage: 2022,
      available: 650,
      price: 18.0,
      seller: '3FkL...9pQa',
      mine: true,
    },
  ];

  // 4. Holdings & Portfolio
  public holdings: Holding[] = [
    {
      code: 'VCS-1524-2023',
      project: 'Rimba Raya Biodiversity Reserve',
      standard: 'VCS',
      vintage: 2023,
      balance: 3200,
      listed: 0,
      retired: 800,
    },
    {
      code: 'GS-8921-2022',
      project: 'Bungoma Clean Cookstoves',
      standard: 'GS',
      vintage: 2022,
      balance: 1400,
      listed: 650,
      retired: 450,
    },
  ];

  public certificates: RetirementCert[] = [
    {
      id: 1,
      code: 'VCS-1524-2023',
      amount: 800,
      beneficiary: 'PT Nusantara Hijau Abadi',
      reason: 'Offset Scope 2 Listrik Q1 2024',
      sig: '5J4K...98La',
      slot: 284191200,
      time: '2024-03-31T08:30:00Z',
    },
  ];

  // 5. Audit Ledger Events
  public ledgerEvents: LedgerEvent[] = [
    {
      id: 101,
      type: 'Mint',
      code: 'VCS-1524-2023',
      amount: 4000,
      sig: '3aB8...9dFa',
      slot: 284190010,
      time: '2024-01-15T09:00:00Z',
      signer: '8TqM...2wKp',
      fee: 0.000005,
      cu: 45000,
      mint: 'M1ntVCS1524xxx',
    },
    {
      id: 102,
      type: 'Retirement',
      code: 'VCS-1524-2023',
      amount: 800,
      sig: '5J4K...98La',
      slot: 284191200,
      time: '2024-03-31T08:30:00Z',
      signer: '8TqM...2wKp',
      fee: 0.000005,
      cu: 38000,
      memo: 'Offset Scope 2 Listrik Q1 2024',
    },
  ];

  // 6. KYB Steps & Compliance
  public kybSteps: KybStep[] = [
    { id: 'nib', name: 'NIB & Izin Operasional', detail: 'Nomor Induk Berusaha berbasis OSS-RBA', status: 'verified', file: 'NIB_912000.pdf' },
    { id: 'akta', name: 'Akta Pendirian & Perubahan', detail: 'Akta Notaris pengesahan Kemenkumham', status: 'verified', file: 'Akta_2022.pdf' },
    { id: 'npwp', name: 'NPWP Perusahaan', detail: 'Validasi kartu pajak & konfirmasi fiskal', status: 'verified', file: 'NPWP_Badan.pdf' },
    { id: 'bod', name: 'Identitas Direksi / UBO', detail: 'KTP/Paspor penanggung jawab emisi', status: 'verified', file: 'KTP_Dir.pdf' },
  ];

  public isoCompliance = {
    verified: true,
    date: '2024-02-18',
    hash: '0x8f4d92a11b72e5c8041a99f1c7d23e5904ab76c8',
    verifier: 'TUV Rheinland Indonesia',
  };

  public offsetPlan = {
    amount: 2500,
  };

  public companyProfile = {
    name: 'PT Nusantara Hijau Abadi',
    sector: 'Manufaktur & Energi',
    reportingPeriod: '2024 (YTD)',
    registrationNumber: 'AHU-0012948.AH.01.01.2021',
    walletAddress: '8TqMPxZ72N4Vp9aB8dFa3J4K98La111111111111',
    network: 'devnet',
    usdcBalance: 45200.0,
  };
}

