'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Holding, RetirementCert } from '../../types';

export default function PortfolioPage() {
  const { t } = useI18n();
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
      showToast('Jumlah tidak valid atau melebihi saldo token');
      return;
    }

    try {
      const cert = await api.retireToken({
        code: retireTarget.code,
        amount,
        beneficiary,
        reason,
      });
      showToast(`Token berhasil di-retire (burn)! Sertifikat #${cert.id} diterbitkan.`);
      setRetireTarget(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal me-retire token');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);

  const totalBalance = holdings.reduce((acc, h) => acc + h.balance, 0);
  const totalListed = holdings.reduce((acc, h) => acc + h.listed, 0);
  const totalRetired = holdings.reduce((acc, h) => acc + h.retired, 0);

  return (
    <div className="space-y-6">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Saldo Token Aktif</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalBalance)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Dapat di-retire atau dijual</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Terkunci di Escrow (Listing)</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {fmt(totalListed)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Sedang ditawarkan di marketplace</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Karbon Diretire (Burn)</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {fmt(totalRetired)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Klaim kompensasi resmi on-chain</div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">Portofolio Kepemilikan Token Karbon</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Batch & Proyek</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Standar</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Vintage</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Saldo Bebas</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Di Escrow</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Diretire</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Aksi</th>
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
                        onClick={() => {
                          setRetireTarget(h);
                          setRetireAmount(String(Math.min(h.balance, 50)));
                        }}
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                      >
                        Retire (Burn)
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Saldo habis</span>
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
        <h3 className="font-bold text-slate-900 mb-4">Sertifikat Offset Karbon Resmi (ISO 14064)</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">ID & Waktu</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Penerima Manfaat</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Alasan Offset</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Jumlah</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">On-Chain Tx</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">Cert #{c.id}</div>
                    <div className="text-xs text-slate-400">{c.time?.slice(0, 10)}</div>
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
                      Unduh PDF ↗
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
            <h3 className="font-bold text-slate-900 text-lg">Retire (Burn) Token Karbon</h3>
            <p className="text-xs text-slate-500">
              Membakar token secara permanen dari akun on-chain untuk mengklaim kompensasi emisi karbon perusahaan.
            </p>

            <form onSubmit={handleRetireSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="text-slate-400">Token Batch:</div>
                <div className="font-bold text-slate-900">{retireTarget.code} ({retireTarget.project})</div>
                <div className="text-slate-500">Sisa saldo bebas: {fmt(retireTarget.balance)} tCO2e</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah Di-burn (tCO2e)</label>
                <input
                  type="number"
                  max={retireTarget.balance}
                  value={retireAmount}
                  onChange={(e) => setRetireAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Penerima Manfaat</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Alasan / Catatan Offset</label>
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
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-rose-700"
                >
                  Konfirmasi Burn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

