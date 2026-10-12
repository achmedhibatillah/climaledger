'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export type LocaleCode = 'id' | 'en';

const dictionaries: Record<LocaleCode, Record<string, string>> = {
  id: {
    app_name: 'ClimaLedger',
    app_tag: 'Carbon Ops',
    nav_dashboard: 'Dashboard',
    nav_tracker: 'Tracker emisi',
    nav_assess: 'Penilaian kredit',
    nav_tokenize: 'Tokenisasi',
    nav_market: 'Marketplace',
    nav_portfolio: 'Portofolio',
    nav_audit: 'Audit dan ESG',
    nav_settings: 'Pengaturan perusahaan',
    grp_overview: 'Ringkasan',
    grp_emission: 'Emisi',
    grp_credit: 'Kredit karbon',
    grp_compliance: 'Kepatuhan',
    wallet_connect: 'Hubungkan wallet',
    wallet_connected: 'Terhubung',
    wallet_disconnected: 'Terputus',
    wallet_demo: '(demo)',
    kyb: 'KYB',
    kyb_pass: 'Lolos',
    kyb_review: 'Ditinjau',
    iso: 'ISO 14064',
    iso_pass: 'Lulus',
    iso_fail: 'Belum',
    kpi_emissions: 'Total emisi (YTD)',
    kpi_offset: 'Karbon berhasil di-offset',
    kpi_tokens: 'Total saldo token',
    kpi_compliance: 'Skor kepatuhan',
    kpi_emissions_sub: 'tCO2e, periode berjalan',
    kpi_offset_sub: 'tCO2e pensiun kumulatif',
    kpi_tokens_sub: 'tCO2e dalam wallet & escrow',
    kpi_compliance_sub: 'KYB, ISO 14064, wallet',
    col_project: 'Proyek',
    col_standard: 'Standar',
    col_vintage: 'Vintage',
    col_remaining: 'Tersisa',
    col_status: 'Status',
    col_action: 'Tindakan',
    btn_export_csv: 'Ekspor CSV',
    btn_export_pdf: 'Ekspor PDF',
    btn_cancel: 'Batal',
    btn_close: 'Tutup',
    btn_confirm_buy: 'Konfirmasi pembelian',
    btn_create_listing: 'Buat listing',
    btn_sign_retire: 'Retire & tanda tangani',
    btn_copy: 'Salin',
    status_ready: 'Siap',
    status_attention: 'Perlu tindakan',
    chart_title: 'Aktivitas token mingguan',
    chart_sub: 'Token di-mint vs di-retire, 8 minggu terakhir',
    legend_minted: 'Di-mint',
    legend_retired: 'Di-retire',
    table_title: 'Batch yang butuh tindakan',
    table_sub: 'Dapat diurutkan dan disaring — fokus pada yang perlu keputusan Anda',
    cta_filter: 'Hanya tampilkan yang perlu tindakan',
    empty_title: 'Tidak ada baris yang cocok',
    empty_body: 'Matikan filter di atas untuk melihat semua batch.',
  },
  en: {
    app_name: 'ClimaLedger',
    app_tag: 'Carbon Ops',
    nav_dashboard: 'Dashboard',
    nav_tracker: 'Emissions tracker',
    nav_assess: 'Credit assessment',
    nav_tokenize: 'Tokenization',
    nav_market: 'Marketplace',
    nav_portfolio: 'Portfolio',
    nav_audit: 'Audit & ESG',
    nav_settings: 'Company settings',
    grp_overview: 'Overview',
    grp_emission: 'Emissions',
    grp_credit: 'Carbon credits',
    grp_compliance: 'Compliance',
    wallet_connect: 'Connect wallet',
    wallet_connected: 'Connected',
    wallet_disconnected: 'Disconnected',
    wallet_demo: '(demo)',
    kyb: 'KYB',
    kyb_pass: 'Passed',
    kyb_review: 'Under review',
    iso: 'ISO 14064',
    iso_pass: 'Passed',
    iso_fail: 'Not yet',
    kpi_emissions: 'Total emissions (YTD)',
    kpi_offset: 'Carbon offset delivered',
    kpi_tokens: 'Total token balance',
    kpi_compliance: 'Compliance score',
    kpi_emissions_sub: 'tCO2e, current period',
    kpi_offset_sub: 'tCO2e retired, cumulative',
    kpi_tokens_sub: 'tCO2e in wallet & escrow',
    kpi_compliance_sub: 'KYB, ISO 14064, wallet',
    col_project: 'Project',
    col_standard: 'Standard',
    col_vintage: 'Vintage',
    col_remaining: 'Remaining',
    col_status: 'Status',
    col_action: 'Action',
    btn_export_csv: 'Export CSV',
    btn_export_pdf: 'Export PDF',
    btn_cancel: 'Cancel',
    btn_close: 'Close',
    btn_confirm_buy: 'Confirm purchase',
    btn_create_listing: 'Create listing',
    btn_sign_retire: 'Retire & sign',
    btn_copy: 'Copy',
    status_ready: 'Ready',
    status_attention: 'Needs attention',
    chart_title: 'Weekly token activity',
    chart_sub: 'Tokens minted vs retired, last 8 weeks',
    legend_minted: 'Minted',
    legend_retired: 'Retired',
    table_title: 'Batches needing action',
    table_sub: 'Sortable and filterable — focused on what needs your decision',
    cta_filter: 'Show only items needing action',
    empty_title: 'No rows match',
    empty_body: 'Turn off the filter above to see all batches.',
  },
};

interface I18nContextType {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>('id');

  useEffect(() => {
    const saved = localStorage.getItem('climaledger.locale') as LocaleCode;
    if (saved === 'id' || saved === 'en') {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    localStorage.setItem('climaledger.locale', next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return dictionaries[locale]?.[key] ?? dictionaries.id?.[key] ?? fallback ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

