'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { MarketListing, Holding } from '../../types';

export default function MarketplacePage() {
  const { t, formatNumber, formatCurrency } = useI18n();
  const { showToast } = useToast();

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStd, setFilterStd] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');
  const [sortOption, setSortOption] = useState('');

  // Modals
  const [buyTarget, setBuyTarget] = useState<MarketListing | null>(null);
  const [buyAmount, setBuyAmount] = useState<string>('100');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Listing Form
  const [listTokenCode, setListTokenCode] = useState('');
  const [listAmount, setListAmount] = useState('100');
  const [listPrice, setListPrice] = useState('15.0');

  useEffect(() => {
    loadListings();
    loadHoldings();
  }, [filterStd, sortOption]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await api.getMarketListings(
        filterStd === 'ALL' ? undefined : filterStd,
        searchQ || undefined,
        sortOption || undefined,
      );
      setListings(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat listing market');
    } finally {
      setLoading(false);
    }
  };

  const loadHoldings = async () => {
    try {
      const hData = await api.getPortfolioHoldings();
      setHoldings(hData);
      if (hData.length > 0) setListTokenCode(hData[0].code);
    } catch {}
  };

  const handleConfirmBuy = async () => {
    if (!buyTarget) return;
    const amount = parseFloat(buyAmount);
    if (!amount || amount <= 0 || amount > buyTarget.available) {
      showToast(t('toast_buy_invalid'));
      return;
    }

    try {
      const res = await api.buyMarketListing(buyTarget.id, amount);
      showToast(t('toast_buy_success'));
      setBuyTarget(null);
      loadListings();
    } catch (err: any) {
      showToast(err.message || t('toast_buy_failed'));
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(listAmount);
    const price = parseFloat(listPrice);
    if (!listTokenCode || !amount || !price) {
      showToast(t('toast_fill_listing_data'));
      return;
    }

    try {
      await api.createMarketListing({
        code: listTokenCode,
        amount,
        price,
      });
      showToast(t('toast_listing_created'));
      setShowCreateModal(false);
      loadListings();
      loadHoldings();
    } catch (err: any) {
      showToast(err.message || t('toast_listing_create_failed'));
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await api.deleteMarketListing(id);
      showToast(t('toast_listing_cancelled'));
      loadListings();
      loadHoldings();
    } catch (err: any) {
      showToast(err.message || t('toast_listing_cancel_failed'));
    }
  };

  const fmt = (n: number) => formatNumber(n, { maximumFractionDigits: 0 });
  const usd = (n: number) => formatCurrency(n, 'USD');

  const totalVol = listings.reduce((acc, l) => acc + l.available, 0);
  const avgPrice = listings.length > 0
    ? listings.reduce((acc, l) => acc + l.price, 0) / listings.length
    : 0;

  // Buy calculations
  const numBuy = parseFloat(buyAmount) || 0;
  const subtotal = buyTarget ? numBuy * buyTarget.price : 0;
  const fee = subtotal * 0.005;
  const totalCost = subtotal + fee;

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_active_listings')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{listings.length}</div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_active_listings_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_market_volume')}</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalVol)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_market_volume_sub')}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_avg_price')}</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {usd(avgPrice)} <span className="text-sm font-semibold text-slate-400">{t('kpi_per_ton')}</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">USDC per tCO2e</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">{t('kpi_settlement_currency')}</div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">Instant (USDC)</div>
          <div className="text-xs text-slate-400 mt-2">{t('kpi_settlement_sub')}</div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', 'VCS', 'GS'].map((std) => (
              <button
                key={std}
                type="button"
                onClick={() => setFilterStd(std)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStd === std
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {std === 'ALL' ? t('filter_all_standards') : std}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition shrink-0"
          >
            {t('btn_new_listing')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder={t('search_listings_placeholder')}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadListings()}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">Default</option>
              <option value="price_asc">{t('sort_price_low')}</option>
              <option value="price_desc">{t('sort_price_high')}</option>
              <option value="vol_desc">{t('sort_volume_high')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">{t('market_title')}</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_project')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_standard')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_vintage')}</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">{t('col_seller')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_remaining')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_price_per_ton')}</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{l.project}</div>
                    <div className="text-xs mono text-slate-400">{l.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                      {l.standard}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right mono">{l.vintage}</td>
                  <td className="px-4 py-3 mono text-xs text-slate-500">
                    {l.mine ? <span className="font-bold text-emerald-600">Self</span> : l.seller}
                  </td>
                  <td className="px-4 py-3 text-right font-bold mono text-slate-900">{fmt(l.available)} t</td>
                  <td className="px-4 py-3 text-right font-black mono text-emerald-700 text-base">
                    {usd(l.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.mine ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        {t('btn_cancel_listing')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setBuyTarget(l);
                          setBuyAmount(String(Math.min(l.available, 100)));
                        }}
                        className="bg-emerald-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                      >
                        {t('btn_buy')} →
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy Modal */}
      {buyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('modal_buy_title')}</h3>
            <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-xs p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400">Batch</dt>
              <dd className="mono font-semibold text-slate-800">{buyTarget.code}</dd>
              <dt className="text-slate-400">{t('col_project')}</dt>
              <dd className="font-semibold text-slate-800">{buyTarget.project}</dd>
              <dt className="text-slate-400">{t('col_price_per_ton')}</dt>
              <dd className="font-bold text-emerald-700">{usd(buyTarget.price)} / ton</dd>
              <dt className="text-slate-400">{t('available_label')}</dt>
              <dd className="mono font-semibold text-slate-800">{fmt(buyTarget.available)} tCO2e</dd>
            </dl>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_buy_amount')}</label>
              <input
                type="number"
                max={buyTarget.available}
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs space-y-1">
              <div>{t('modal_subtotal')}: {usd(subtotal)}</div>
              <div>{t('modal_fee')}: {usd(fee)}</div>
              <div className="font-bold text-sm pt-1 border-t border-indigo-200/50">
                {t('modal_total_payment')}: {usd(totalCost)}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBuyTarget(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
              >
                {t('btn_cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmBuy}
                className="flex-1 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700"
              >
                {t('btn_confirm_buy')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">{t('modal_create_listing_title')}</h3>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_select_token')}</label>
                <select
                  value={listTokenCode}
                  onChange={(e) => setListTokenCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {holdings.map((h) => (
                    <option key={h.code} value={h.code}>
                      {h.code} ({t('col_free_balance')}: {fmt(h.balance)} tCO2e)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_listing_amount')}</label>
                <input
                  type="number"
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{t('modal_price_per_ton')}</label>
                <input
                  type="number"
                  step="0.1"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
                >
                  {t('btn_cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700"
                >
                  {t('btn_create_listing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
