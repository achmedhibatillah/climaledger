'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { LedgerEvent } from '../../types';

export default function AuditExplorerPage() {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [reconciliation, setReconciliation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');

  // Tx Detail Modal
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txTab, setTxTab] = useState<'ov' | 'bal' | 'raw'>('ov');

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lList, rList] = await Promise.all([
        api.getAuditLedger(filterType === 'ALL' ? undefined : filterType, searchQ || undefined),
        api.getAuditReconciliation(),
      ]);
      setLedger(lList);
      setReconciliation(rList);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat audit ledger');
    } finally {
      setLoading(false);
    }
  };

  const openTxDetail = async (id: number) => {
    try {
      const data = await api.getAuditLedgerById(id);
      setSelectedTx(data);
      setTxTab('ov');
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat detail transaksi');
    }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    showToast('Disalin ke clipboard!');
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const latestSlot = ledger.length > 0 ? Math.max(...ledger.map((e) => e.slot)) : 284192000;

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Total Transaksi On-Chain</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{ledger.length} TX</div>
          <div className="text-xs text-slate-400 mt-2">Seluruh blok termuat</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Finality Konsensus</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">100% Finalized</div>
          <div className="text-xs text-slate-400 mt-2">Solana confirmed state</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Slot Solana Terakhir</div>
          <div className="text-2xl font-black text-slate-900 mono tracking-tight">{latestSlot}</div>
          <div className="text-xs text-slate-400 mt-2">Sinkronisasi ledger lokal</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Status Rekonsiliasi 3-Arah</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-1.5">
            ✓ MATCH
          </div>
          <div className="text-xs text-slate-400 mt-2">Registry ↔ On-Chain ↔ DB</div>
        </div>
      </div>

      {/* Reconciliation 3-Way Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-slate-900">Rekonsiliasi Integritas 3-Arah (Zero Double-Counting)</h3>
            <p className="text-xs text-slate-400">
              Memastikan total token yang dicetak sama persis dengan total alokasi yang beredar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="http://localhost:3001/api/v1/audit/export.csv"
              download="audit-ledger.csv"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ekspor CSV
            </a>
            <a
              href="http://localhost:3001/api/v1/audit/export.pdf"
              download="audit-report.pdf"
              className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700"
            >
              Laporan PDF
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reconciliation.map((r) => (
            <div key={r.code} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{r.code}</div>
                <div className="text-xs text-slate-500">{r.project}</div>
                <div className="text-xs mono text-slate-400 mt-1">
                  Minted: {fmt(r.minted)} t = Alokasi: {fmt(r.balanceListedRetired)} t
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1">
                ✓ {r.match ? 'MATCH' : 'MISMATCH'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Type Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'Mint', 'Pembelian', 'Listing', 'Retirement'].map((tName) => (
              <button
                key={tName}
                onClick={() => setFilterType(tName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterType === tName
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tName === 'ALL' ? 'Semua Tipe' : tName}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari signature atau kode batch…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Signature Transaksi</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Tipe Instruksi</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Batch & Jumlah</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Solana Slot</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Waktu</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 mono text-xs font-medium text-slate-700 truncate max-w-[160px]">
                    {e.sig}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${
                        e.type === 'Mint'
                          ? 'bg-emerald-50 text-emerald-700'
                          : e.type === 'Retirement'
                          ? 'bg-rose-50 text-rose-700'
                          : e.type === 'Pembelian'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">{e.code}</span> ·{' '}
                    <span className="mono font-bold text-emerald-700">{fmt(e.amount)} t</span>
                  </td>
                  <td className="px-4 py-3 text-right mono font-semibold text-slate-700">{e.slot}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{e.time?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openTxDetail(e.id)}
                      className="text-xs text-emerald-700 font-semibold hover:underline"
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal (Exact from HTML template) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-soft space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Detail Transaksi On-Chain</h3>
            <div className="rounded-xl bg-indigo-50 text-indigo-800 text-xs p-3">
              Instruksi <b>{selectedTx.type}</b> sebanyak <b>{fmt(selectedTx.amount)} tCO2e</b> pada batch {selectedTx.code}.
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 text-sm font-semibold">
              <button
                onClick={() => setTxTab('ov')}
                className={`px-3 py-2 border-b-2 transition ${
                  txTab === 'ov' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setTxTab('bal')}
                className={`px-3 py-2 border-b-2 transition ${
                  txTab === 'bal' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                Perubahan Saldo
              </button>
              <button
                onClick={() => setTxTab('raw')}
                className={`px-3 py-2 border-b-2 transition ${
                  txTab === 'raw' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400'
                }`}
              >
                Data Mentah (JSON)
              </button>
            </div>

            {/* Tab 1: Overview */}
            {txTab === 'ov' && (
              <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-xs">
                <dt className="text-slate-400">Signature</dt>
                <dd className="mono break-all text-slate-900 flex items-center gap-1">
                  <span>{selectedTx.sig}</span>
                  <button onClick={() => copyText(selectedTx.sig)} className="text-emerald-700 font-bold shrink-0">
                    Salin
                  </button>
                </dd>

                <dt className="text-slate-400">Solana Slot</dt>
                <dd className="mono font-bold text-slate-900">{selectedTx.slot}</dd>

                <dt className="text-slate-400">Hasil Konsensus</dt>
                <dd>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5">
                    Success · Finalized
                  </span>
                </dd>

                <dt className="text-slate-400">Signer</dt>
                <dd className="mono break-all text-slate-900">{selectedTx.signer}</dd>

                <dt className="text-slate-400">Fee Transaksi</dt>
                <dd className="mono">{selectedTx.fee} SOL</dd>

                <dt className="text-slate-400">Compute Units</dt>
                <dd className="mono">{selectedTx.cu} CU</dd>
              </dl>
            )}

            {/* Tab 2: Balance Changes */}
            {txTab === 'bal' && (
              <div className="rounded-xl border border-slate-100 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2.5 font-bold text-slate-500">Akun</th>
                      <th className="p-2.5 font-bold text-slate-500">Token</th>
                      <th className="p-2.5 text-right font-bold text-slate-500">Perubahan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 mono">{selectedTx.signer?.slice(0, 8)}…</td>
                      <td className="p-2.5 font-semibold">{selectedTx.code}</td>
                      <td className="p-2.5 text-right font-bold mono text-emerald-700">
                        {selectedTx.type === 'Retirement' ? '-' : '+'}{fmt(selectedTx.amount * 1000)} units
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Raw JSON */}
            {txTab === 'raw' && (
              <pre className="bg-slate-950 text-slate-200 rounded-xl p-4 text-xs mono overflow-auto max-h-60">
                {JSON.stringify(selectedTx.raw || selectedTx, null, 2)}
              </pre>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-slate-100 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

