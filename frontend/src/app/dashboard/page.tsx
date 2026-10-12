'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { DashboardSummary } from '../../types';

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActionOnly, setFilterActionOnly] = useState(false);
  const [sortField, setSortField] = useState<'vintage' | 'remaining'>('remaining');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(n));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft h-32 skel" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft h-64 skel" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-12 shadow-soft">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          !
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">Gagal memuat data</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button
          onClick={fetchData}
          className="bg-brand-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-700 transition"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  // Sorting & Filtering rows
  let rows = [...(data.registryRows || [])];
  if (filterActionOnly) {
    rows = rows.filter((r) => r.status === 'pending' || r.remaining > 0);
  }
  rows.sort((a, b) => {
    const diff = a[sortField] - b[sortField];
    return sortDir === 'asc' ? diff : -diff;
  });

  const toggleSort = (field: 'vintage' | 'remaining') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const offsetPercent = data.emissions.total > 0
    ? Math.min(100, Math.round((data.retiredTotal / data.emissions.total) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Emisi Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_emissions')}</span>
            <span className="inline-flex items-center gap-0.5 text-rose-600">▲ 2.4%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(data.emissions.total)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_emissions_sub')}</div>
        </div>

        {/* KPI 2: Karbon di-offset */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_offset')}</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600">▲ 5.1%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight text-emerald-700">
            {fmt(data.retiredTotal)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_offset_sub')}</div>
        </div>

        {/* KPI 3: Saldo Token */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_tokens')}</span>
            <span className="inline-flex items-center gap-0.5 text-slate-500">▼ 1.2%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(data.tokenBalanceTotal)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_tokens_sub')}</div>
        </div>

        {/* KPI 4: Skor Kepatuhan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_compliance')}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5">
              {t('status_ready')}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data.complianceScore} <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_compliance_sub')}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{t('chart_title')}</h3>
              <p className="text-xs text-slate-400">{t('chart_sub')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <i className="w-3 h-3 rounded bg-emerald-500 inline-block" /> {t('legend_minted')}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <i className="w-3 h-3 rounded bg-slate-400 inline-block" /> {t('legend_retired')}
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
            {data.weeklySeries.map((s, idx) => {
              const maxH = 2500;
              const hMint = Math.min(100, (s.minted / maxH) * 100);
              const hRet = Math.min(100, (s.retired / maxH) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${hMint}%` }}
                      className="w-3 sm:w-4 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                      title={`Minted: ${s.minted}`}
                    />
                    <div
                      style={{ height: `${hRet}%` }}
                      className="w-3 sm:w-4 bg-slate-300 rounded-t transition-all hover:bg-slate-400"
                      title={`Retired: ${s.retired}`}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 mt-2">{s.week}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Offset Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-slate-900 mb-1">Offset Progress</h3>
          <p className="text-xs text-slate-400 mb-6">Persentase net-zero emisi berjalan</p>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500"
                strokeDasharray={`${offsetPercent}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-slate-900">{offsetPercent}%</span>
              <span className="block text-[11px] font-semibold text-slate-400 uppercase">Offset</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            <b>{fmt(data.retiredTotal)}</b> dari <b>{fmt(data.emissions.total)} tCO2e</b> telah dikompensasi
          </div>
        </div>
      </div>

      {/* Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900">{t('table_title')}</h3>
            <p className="text-xs text-slate-400">{t('table_sub')}</p>
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={filterActionOnly}
              onChange={(e) => setFilterActionOnly(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500"
            />
            {t('cta_filter')}
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_project')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_standard')}</th>
                <th
                  onClick={() => toggleSort('vintage')}
                  className="text-right px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-900"
                >
                  {t('col_vintage')} {sortField === 'vintage' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => toggleSort('remaining')}
                  className="text-right px-4 py-3 text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-900"
                >
                  {t('col_remaining')} {sortField === 'remaining' && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_status')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.project}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      {row.standard}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right mono text-slate-600">{row.vintage}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(row.remaining)} t</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-2.5 py-0.5 ${
                        row.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.status === 'active' ? 'Aktif' : 'Menunggu'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === 'active' && row.remaining > 0 ? (
                      <Link
                        href={`/tokenize?batch=${row.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        Tokenisasi →
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

