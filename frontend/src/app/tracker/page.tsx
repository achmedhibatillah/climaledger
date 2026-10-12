'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { EmissionCategory, EmissionEntry } from '../../types';

export default function EmissionsTrackerPage() {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<EmissionCategory[]>([]);
  const [entries, setEntries] = useState<EmissionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input state
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [inputQty, setInputQty] = useState('');

  // Filter state
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, entrs] = await Promise.all([
        api.getEmissionCategories(),
        api.getEmissionEntries(),
      ]);
      setCategories(cats);
      setEntries(entrs);
      if (cats.length > 0) setSelectedCat(cats[0].key);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data emisi');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(inputQty);
    if (!qty || qty <= 0) {
      showToast('Masukkan jumlah aktivitas yang valid');
      return;
    }

    try {
      const newEntry = await api.createEmissionEntry({
        categoryKey: selectedCat,
        month: selectedMonth,
        qty,
      });
      setEntries([...entries, newEntry]);
      setInputQty('');
      showToast('Aktivitas emisi berhasil ditambahkan');
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan entri');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await api.deleteEmissionEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
      showToast('Entri berhasil dihapus');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus entri');
    }
  };

  // Calculations
  let scope1 = 0;
  let scope2 = 0;
  let scope3 = 0;

  entries.forEach((e) => {
    const cat = categories.find((c) => c.key === e.categoryKey);
    if (cat) {
      const tco2 = e.qty * cat.factor;
      if (cat.scope === 1) scope1 += tco2;
      else if (cat.scope === 2) scope2 += tco2;
      else if (cat.scope === 3) scope3 += tco2;
    }
  });
  const totalEmissions = scope1 + scope2 + scope3;

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);
  const fmtF = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 5 }).format(n);

  // Filtered rows
  const filteredEntries = entries.filter((e) => {
    if (filterMonth !== 'all' && e.month !== Number(filterMonth)) return false;
    if (filterScope !== 'all') {
      const cat = categories.find((c) => c.key === e.categoryKey);
      if (!cat || cat.scope !== Number(filterScope)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 KPI Scope Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_emissions')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalEmissions)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Scope 1, 2, dan 3 terhitung</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Scope 1 (Emisi Langsung)</div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {fmt(scope1)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Genset, bahan bakar armada</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Scope 2 (Energi Listrik)</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {fmt(scope2)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Konsumsi listrik PLN / grid</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Scope 3 (Rantai Pasok)</div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">
            {fmt(scope3)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Logistik pihak ke-3, dinas</div>
        </div>
      </div>

      {/* Input Form & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">Input Data Aktivitas Emisi (GHG Protocol)</h3>
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori Emisi</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.nameId} (Scope {c.scope})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Jumlah ({categories.find((c) => c.key === selectedCat)?.unitId || 'Satuan'})
            </label>
            <input
              type="number"
              step="any"
              placeholder="Contoh: 1500"
              value={inputQty}
              onChange={(e) => setInputQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            + Tambah Aktivitas
          </button>
        </form>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900">Daftar Aktivitas Emisi</h3>
            <span className="text-xs text-slate-400">({filteredEntries.length} data)</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">Semua Bulan</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>

            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">Semua Scope</option>
              <option value="1">Scope 1</option>
              <option value="2">Scope 2</option>
              <option value="3">Scope 3</option>
            </select>

            <a
              href="http://localhost:3001/api/v1/emissions/export.csv"
              download="climaledger-emissions.csv"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              {t('btn_export_csv')}
            </a>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Periode</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Scope</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Jumlah Aktivitas</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Faktor (tCO2e/unit)</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Total (tCO2e)</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((e) => {
                const cat = categories.find((c) => c.key === e.categoryKey);
                const tco2 = cat ? e.qty * cat.factor : 0;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">Bulan {e.month}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{cat?.nameId || e.categoryKey}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          cat?.scope === 1
                            ? 'bg-rose-50 text-rose-700'
                            : cat?.scope === 2
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        Scope {cat?.scope || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right mono text-slate-700">
                      {fmt(e.qty)} {cat?.unitId}
                    </td>
                    <td className="px-4 py-3 text-right mono text-slate-500">{cat ? fmtF(cat.factor) : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 mono">{fmt(tco2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

