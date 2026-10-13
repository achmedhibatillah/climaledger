'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n';
import { api, FALLBACK_DASHBOARD_SUMMARY } from '../../lib/api';
import { DashboardSummary } from '../../types';

export default function DashboardPage() {
  const { t, locale, setLocale } = useI18n();
  const [data, setData] = useState<DashboardSummary>(FALLBACK_DASHBOARD_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [filterActionOnly, setFilterActionOnly] = useState(false);
  const [sortField, setSortField] = useState<'vintage' | 'remaining'>('remaining');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async (isManualSync = false) => {
    try {
      if (isManualSync) setSyncing(true);
      else setLoading(true);

      const summary = await api.getDashboardSummary();
      if (summary) {
        setData(summary);
        setIsLiveBackend(Boolean(summary.isLive));
      } else {
        setData(FALLBACK_DASHBOARD_SUMMARY);
        setIsLiveBackend(false);
      }
    } catch (err) {
      console.warn('[Dashboard] Error fetching backend data, using baseline dataset:', err);
      setData(FALLBACK_DASHBOARD_SUMMARY);
      setIsLiveBackend(false);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format numbers dynamically based on active locale (id-ID vs en-US)
  const fmt = (n: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(Math.round(n || 0));
  };

  // Sorting & Filtering rows
  let rows = [...(data?.registryRows || [])];
  if (filterActionOnly) {
    rows = rows.filter((r) => r.status === 'pending' || r.remaining > 0);
  }
  rows.sort((a, b) => {
    const diff = (a[sortField] || 0) - (b[sortField] || 0);
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

  const totalEmissions = data?.emissions?.total || 0;
  const retiredTotal = data?.retiredTotal || 0;
  const offsetPercent = totalEmissions > 0
    ? Math.min(100, Math.round((retiredTotal / totalEmissions) * 100))
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-white rounded-2xl border border-slate-200 p-4 skel" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft h-32 skel" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft h-64 skel" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Language/Sync Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {t('dash_title')}
            </h1>
            {isLiveBackend ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('dash_sync_status_connected')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {t('dash_sync_status_offline')}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {t('dash_sub')} • <span className="font-semibold text-slate-700">{data?.org}</span> ({data?.periodLabel})
          </p>
        </div>

        {/* Dashboard Content Controls: In-Dashboard Language Switcher & Sync Button */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* In-Dashboard Language Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs">
            <span className="text-slate-500 font-medium">{t('dash_lang_label')}</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden p-0.5">
              <button
                type="button"
                onClick={() => setLocale('id')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  locale === 'id' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  locale === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs disabled:opacity-60"
            title="Re-sync data with NestJS Backend"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={syncing ? 'animate-spin text-emerald-600' : 'text-slate-500'}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {syncing ? t('dash_syncing') : t('dash_sync_btn')}
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Emisi Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_emissions')}</span>
            <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">▲ 2.4%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalEmissions)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_emissions_sub')}</div>
        </div>

        {/* KPI 2: Karbon di-offset */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_offset')}</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">▲ 5.1%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight text-emerald-700">
            {fmt(retiredTotal)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_offset_sub')}</div>
        </div>

        {/* KPI 3: Saldo Token */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_tokens')}</span>
            <span className="inline-flex items-center gap-0.5 text-slate-500 font-bold">▼ 1.2%</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(data?.tokenBalanceTotal || 0)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_tokens_sub')}</div>
        </div>

        {/* KPI 4: Skor Kepatuhan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>{t('kpi_compliance')}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5">
              {t('status_ready')}
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {data?.complianceScore || 0} <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_compliance_sub')}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
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

          <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 md:gap-3 pt-6 border-b border-slate-100">
            {(data?.weeklySeries || []).map((s, idx) => {
              const maxH = 2500;
              const hMint = Math.min(100, ((s.minted || 0) / maxH) * 100);
              const hRet = Math.min(100, ((s.retired || 0) / maxH) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                    <div
                      style={{ height: `${hMint}%` }}
                      className="w-2 sm:w-3 md:w-4 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                      title={`${t('legend_minted')}: ${s.minted}`}
                    />
                    <div
                      style={{ height: `${hRet}%` }}
                      className="w-2 sm:w-3 md:w-4 bg-slate-300 rounded-t transition-all hover:bg-slate-400"
                      title={`${t('legend_retired')}: ${s.retired}`}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-2 truncate">{s.week}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Offset Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-slate-900 mb-1">{t('donut_title')}</h3>
          <p className="text-xs text-slate-400 mb-6">{t('donut_sub')}</p>

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
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('donut_label')}</span>
            </div>
          </div>

          <div className="mt-6 text-xs text-slate-500">
            <b>{fmt(retiredTotal)}</b> {t('donut_summary_part1')} <b>{fmt(totalEmissions)} tCO2e</b> {t('donut_summary_part2')}
          </div>
        </div>
      </div>

      {/* Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-soft">
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
              {rows.length > 0 ? (
                rows.map((row) => (
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
                        {row.status === 'active' ? t('status_active') : t('status_pending')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === 'active' && row.remaining > 0 ? (
                        <Link
                          href={`/tokenize?batch=${row.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          {t('action_tokenize')}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <div className="font-semibold text-slate-600">{t('empty_title')}</div>
                    <div className="text-xs mt-1">{t('empty_body')}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
