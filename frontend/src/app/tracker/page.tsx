'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { EmissionCategory, EmissionEntry } from '../../types';

export default function EmissionsTrackerPage() {
  const { t, locale, formatNumber } = useI18n();
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
      showToast(err.message || t('toast_load_failed_emissions'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(inputQty);
    if (!qty || qty <= 0) {
      showToast(t('toast_invalid_qty'));
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
      showToast(t('toast_entry_added'));
    } catch (err: any) {
      showToast(err.message || t('toast_entry_add_failed'));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await api.deleteEmissionEntry(id);
      setEntries(entries.filter((e) => e.id !== id));
      showToast(t('toast_entry_deleted'));
    } catch (err: any) {
      showToast(err.message || t('toast_entry_delete_failed'));
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

  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 2 });
  const fmtF = (n: number) => formatNumber(n, { maximumFractionDigits: 5 });

  const getCatName = (cat?: EmissionCategory) => {
    if (!cat) return '';
    return locale === 'en' ? (cat.nameEn || cat.nameId) : cat.nameId;
  };

  const getCatUnit = (cat?: EmissionCategory) => {
    if (!cat) return '';
    return locale === 'en' ? (cat.unitEn || cat.unitId) : cat.unitId;
  };

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
          <div className="text-xs text-slate-400 mt-2">{t('scope_all_calculated')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('scope_1_title')}</div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {fmt(scope1)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('scope_1_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('scope_2_title')}</div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {fmt(scope2)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('scope_2_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('scope_3_title')}</div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">
            {fmt(scope3)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('scope_3_sub')}</div>
        </div>
      </div>

      {/* Input Form & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">{t('tracker_form_title')}</h3>
        <form onSubmit={handleAddEntry} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('form_month')}</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {t('form_month')} {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t('form_category')}</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {getCatName(c)} (Scope {c.scope})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              {t('form_qty')} ({getCatUnit(categories.find((c) => c.key === selectedCat)) || 'Unit'})
            </label>
            <input
              type="number"
              step="any"
              placeholder={t('form_qty_placeholder')}
              value={inputQty}
              onChange={(e) => setInputQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            {t('form_btn_add')}
          </button>
        </form>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900">{t('tracker_table_title')}</h3>
            <span className="text-xs text-slate-400">
              ({filteredEntries.length} {t('tracker_table_records')})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">{t('filter_all_months')}</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {t('form_month')} {m}
                </option>
              ))}
            </select>

            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">{t('filter_all_scopes')}</option>
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
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_period')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_category')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_scope')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_activity_qty')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_factor')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_total_tco2e')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((e) => {
                const cat = categories.find((c) => c.key === e.categoryKey);
                const tco2 = cat ? e.qty * cat.factor : 0;
                return (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {t('form_month')} {e.month}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {getCatName(cat) || e.categoryKey}
                    </td>
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
                      {fmt(e.qty)} {getCatUnit(cat)}
                    </td>
                    <td className="px-4 py-3 text-right mono text-slate-500">{cat ? fmtF(cat.factor) : '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 mono">{fmt(tco2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(e.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        {t('btn_delete')}
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
