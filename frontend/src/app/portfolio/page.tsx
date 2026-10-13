'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Holding, RetirementCert } from '../../types';

export default function PortfolioPage() {
  const { t, formatNumber, formatDate } = useI18n();
  const { showToast } = useToast();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [certificates, setCertificates] = useState<RetirementCert[]>([]);
  const [loading, setLoading] = useState(true);

  // Retire Modal
  const [retireTarget, setRetireTarget] = useState<Holding | null>(null);
  const [retireAmount, setRetireAmount] = useState('100');
  const [beneficiary, setBeneficiary] = useState('PT Nusantara Hijau Abadi');
  const [reason, setReason] = useState('Offset Emisi Scope 2 Q1 2024');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hList, certList] = await Promise.all([
        api.getPortfolioHoldings(),
        api.getCertificates(),
      ]);
      setHoldings(hList);
      setCertificates(certList);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat portofolio');
    } finally {
      setLoading(false);
    }
  };

  const handleRetireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retireTarget) return;

    const amount = parseFloat(retireAmount);
    if (!amount || amount <= 0 || amount > retireTarget.balance) {
      showToast(t('toast_retire_invalid'));
      return;
    }

    try {
      const cert = await api.retireToken({
        code: retireTarget.code,
        amount,
        beneficiary,
        reason,
      });
      showToast(t('toast_retire_success'));
      setRetireTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || t('toast_retire_failed'));
    }
  };

  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 0 });

  const totalBalance = holdings.reduce((acc, h) => acc + h.balance, 0);
  const totalListed = holdings.reduce((acc, h) => acc + h.listed, 0);
  const totalRetired = holdings.reduce((acc, h) => acc + h.retired, 0);

  return (
    <div className="space-y-6">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_total_active_balance')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalBalance)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_total_active_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_locked_escrow')}</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {fmt(totalListed)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_locked_escrow_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_retired_total')}</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {fmt(totalRetired)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_retired_sub')}</div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">{t('portfolio_table_title')}</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_batch_project')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_standard')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_vintage')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_free_balance')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_in_escrow')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_retired_qty')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holdings.map((h) => (
                <tr key={h.code} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{h.project}</div>
                    <div className="text-xs mono text-slate-400">{h.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      {h.standard}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right mono">{h.vintage}</td>
                  <td className="px-4 py-3 text-right font-black mono text-emerald-700 text-base">{fmt(h.balance)} t</td>
                  <td className="px-4 py-3 text-right mono text-amber-600 font-bold">{fmt(h.listed)} t</td>
                  <td className="px-4 py-3 text-right mono text-slate-500">{fmt(h.retired)} t</td>
                  <td className="px-4 py-3 text-right">
                    {h.balance > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRetireTarget(h);
                          setRetireAmount(String(Math.min(h.balance, 50)));
                        }}
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                      >
                        {t('btn_retire_action')}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">{t('badge_depleted')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">{t('certificates_heading')}</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_cert_id')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_beneficiary')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_reason')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_remaining')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">On-Chain Tx</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">Cert #{c.id}</div>
                    <div className="text-xs text-slate-400">
                      {c.time ? formatDate(c.time.slice(0, 10)) : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.beneficiary}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.reason}</td>
                  <td className="px-4 py-3 text-right font-black mono text-emerald-700">{fmt(c.amount)} t</td>
                  <td className="px-4 py-3 mono text-xs text-slate-500 truncate max-w-[140px]">
                    {c.sig}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={`http://localhost:3001/api/v1/portfolio/certificates/${c.id}/pdf`}
                      download={`cert-${c.id}.pdf`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {t('btn_export_pdf')} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retire Modal */}
      {retireTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('modal_retire_title')}</h3>
            <p className="text-xs text-slate-500">{t('modal_retire_desc')}</p>

            <form onSubmit={handleRetireSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="text-slate-400">Token Batch:</div>
                <div className="font-bold text-slate-900">{retireTarget.code} ({retireTarget.project})</div>
                <div className="text-slate-500">{t('col_free_balance')}: {fmt(retireTarget.balance)} tCO2e</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_retire_amount')}</label>
                <input
                  type="number"
                  max={retireTarget.balance}
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_beneficiary')}</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_reason')}</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRetireTarget(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-rose-700"
                >
                  {t('btn_sign_retire')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
