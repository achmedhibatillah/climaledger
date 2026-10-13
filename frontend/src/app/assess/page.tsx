'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { RegistryBatch } from '../../types';

export default function CreditAssessmentPage() {
  const { t, formatNumber } = useI18n();
  const { showToast } = useToast();
  const [batches, setBatches] = useState<RegistryBatch[]>([]);
  const [iso, setIso] = useState<any>({
    verified: true,
    date: '2024-02-18',
    hash: '0x8f4d92a11b72e5c8041a99f1c7d23e5904ab76c8',
    verifier: 'TUV Rheinland Indonesia',
  });
  const [offsetPlan, setOffsetPlan] = useState<number>(2500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bList, isoData] = await Promise.all([
        api.getRegistryBatches(),
        api.getIsoCompliance(),
      ]);
      setBatches(bList);
      setIso(isoData);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (val: number) => {
    setOffsetPlan(val);
    api.updateOffsetPlan(val).catch(() => {});
  };

  const eligibleTotal = batches
    .filter((b) => b.eligible)
    .reduce((acc, b) => acc + b.remaining, 0);

  const surplus = Math.max(0, eligibleTotal - offsetPlan);
  const planPercent = eligibleTotal > 0 ? Math.min(100, Math.round((offsetPlan / eligibleTotal) * 100)) : 0;
  const surplusPercent = 100 - planPercent;

  const fmt = (n: number) => formatNumber(Math.round(n), { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('iso_verified_label')}</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
            {t('iso_fully_verified')}
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('iso_audit_valid')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('standards_recognized')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            2 <span className="text-xs font-semibold text-slate-400">(VCS, GS)</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('standards_recognized_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('active_registry_batches')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {batches.filter((b) => b.status === 'active').length} / {batches.length}
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('ready_to_tokenize')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kyb_verification_title')}</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {t('kyb_verification_score')}
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kyb_verification_sub')}</div>
        </div>
      </div>

      {/* Surplus Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{t('calculator_title')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('calculator_sub')}</p>
          </div>
          <Link
            href="/tokenize"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-xl hover:bg-emerald-700 transition shrink-0"
          >
            {t('btn_tokenize_surplus')}
          </Link>
        </div>

        {/* 3 Large Stat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 mb-6 text-center">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">{t('calc_eligible_credits')}</div>
            <div className="text-3xl font-black text-slate-900">{fmt(eligibleTotal)}</div>
            <div className="text-[11px] text-slate-400">tCO2e (VCS & GS)</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">{t('calc_internal_plan')}</div>
            <div className="text-3xl font-black text-indigo-600">{fmt(offsetPlan)}</div>
            <div className="text-[11px] text-slate-400">tCO2e ({planPercent}%)</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">{t('calc_surplus_market')}</div>
            <div className="text-3xl font-black text-emerald-600">{fmt(surplus)}</div>
            <div className="text-[11px] text-slate-400">tCO2e ({surplusPercent}%)</div>
          </div>
        </div>

        {/* Two-tone Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${planPercent}%` }}
              className="bg-indigo-500 transition-all"
              title={`${t('legend_internal')}: ${planPercent}%`}
            />
            <div
              style={{ width: `${surplusPercent}%` }}
              className="bg-emerald-500 transition-all"
              title={`${t('legend_surplus')}: ${surplusPercent}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> {t('legend_internal')} ({planPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <i className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {t('legend_surplus')} ({surplusPercent}%)
            </span>
          </div>
        </div>

        {/* Slider & Input */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={eligibleTotal || 1000}
            step={50}
            value={offsetPlan}
            onChange={(e) => handlePlanChange(Number(e.target.value))}
            className="flex-1 rng h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="w-32">
            <input
              type="number"
              value={offsetPlan}
              onChange={(e) => handlePlanChange(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-right font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>
      </div>

      {/* ISO Status & Registry Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ISO Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
          <h3 className="font-bold text-slate-900">{t('iso_cert_heading')}</h3>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs space-y-2">
            <div className="font-bold text-sm">{t('iso_cert_status_full')}</div>
            <div>
              {t('iso_auditor')}: {iso.verifier}
            </div>
            <div>
              {t('iso_audit_date')}: {iso.date}
            </div>
            <div className="mono break-all text-[11px] text-emerald-700">Hash: {iso.hash}</div>
          </div>
          <p className="text-xs text-slate-400">{t('iso_onchain_note')}</p>
        </div>

        {/* Registry Batches Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
          <h3 className="font-bold text-slate-900 mb-4">{t('verified_batches_heading')}</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_project')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_standard')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_vintage')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_remaining')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.project}</div>
                      <div className="text-xs mono text-slate-400">{b.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                        {b.standard}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right mono">{b.vintage}</td>
                    <td className="px-4 py-3 text-right font-bold mono text-slate-900">{fmt(b.remaining)} t</td>
                    <td className="px-4 py-3 text-right">
                      {b.eligible && b.remaining > 0 ? (
                        <Link
                          href={`/tokenize?batch=${b.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          {t('action_tokenize')}
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">{t('not_eligible_yet')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
