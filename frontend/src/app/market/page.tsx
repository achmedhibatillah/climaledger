'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { MarketListing, Holding } from '../../types';

export default function MarketplacePage() {
  const { t } = useI18n();
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
      showToast('Jumlah pembelian tidak valid');
      return;
    }

    try {
      const res = await api.buyMarketListing(buyTarget.id, amount);
      showToast(`Pembelian berhasil! Transaksi: ${res.txSignature.slice(0, 8)}…`);
      setBuyTarget(null);
      loadListings();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses pembelian');
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(listAmount);
    const price = parseFloat(listPrice);
    if (!listTokenCode || !amount || !price) {
      showToast('Lengkapi data listing');
      return;
    }

    try {
      await api.createMarketListing({
        code: listTokenCode,
        amount,
        price,
      });
      showToast('Listing berhasil dibuat!');
      setShowCreateModal(false);
      loadListings();
      loadHoldings();
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat listing');
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await api.deleteMarketListing(id);
      showToast('Listing dibatalkan');
      loadListings();
      loadHoldings();
    } catch (err: any) {
      showToast(err.message || 'Gagal membatalkan listing');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  const usd = (n: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

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
          <div className="text-xs font-semibold text-slate-500 mb-1">Listing Aktif</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{listings.length} Pasang</div>
          <div className="text-xs text-slate-400 mt-2">Bursa terbuka 24/7</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Volume Tersedia</div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {fmt(totalVol)} <span className="text-sm font-semibold text-slate-400">tCO2e</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">Siap untuk instant settlement</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Harga Rata-Rata</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            ${usd(avgPrice)} <span className="text-sm font-semibold text-slate-400">/ ton</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">USDC per tCO2e</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft">
          <div className="text-xs font-semibold text-slate-500 mb-1">Penyelesaian On-Chain</div>
          <div className="text-2xl font-black text-indigo-600 tracking-tight">Instant (USDC)</div>
          <div className="text-xs text-slate-400 mt-2">Atomic swap via Smart Contract</div>
        </div>
      </div>

      {/* Action Header & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Standard */}
            {['ALL', 'VCS', 'GS'].map((std) => (
              <button
                key={std}
                onClick={() => setFilterStd(std)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterStd === std
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {std === 'ALL' ? 'Semua Standar' : std}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition"
          >
            + Buat Listing Penjualan
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Cari proyek atau kode batch (contoh: VCS, Rimba, Cookstoves)…"
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
              <option value="">Urutkan: Default</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
              <option value="vol_desc">Volume Terbesar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft">
        <h3 className="font-bold text-slate-900 mb-4">Daftar Order Pasar Kredit Karbon</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Batch & Proyek</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Standar</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Vintage</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500">Penjual</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Tersedia</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Harga (USDC)</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-500">Aksi</th>
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
                    {l.mine ? <span className="font-bold text-emerald-600">Anda</span> : l.seller}
                  </td>
                  <td className="px-4 py-3 text-right font-bold mono text-slate-900">{fmt(l.available)} t</td>
                  <td className="px-4 py-3 text-right font-black mono text-emerald-700 text-base">
                    ${usd(l.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {l.mine ? (
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Batalkan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setBuyTarget(l);
                          setBuyAmount(String(Math.min(l.available, 100)));
                        }}
                        className="bg-emerald-600 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                      >
                        Beli →
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
            <h3 className="font-bold text-slate-900 text-lg">Beli Kredit Karbon</h3>
            <dl className="grid grid-cols-[100px_1fr] gap-y-2 text-xs p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400">Batch</dt>
              <dd className="mono font-semibold text-slate-800">{buyTarget.code}</dd>
              <dt className="text-slate-400">Proyek</dt>
              <dd className="font-semibold text-slate-800">{buyTarget.project}</dd>
              <dt className="text-slate-400">Harga Satuan</dt>
              <dd className="font-bold text-emerald-700">${usd(buyTarget.price)} USDC / ton</dd>
              <dt className="text-slate-400">Maks Tersedia</dt>
              <dd className="mono font-semibold text-slate-800">{fmt(buyTarget.available)} tCO2e</dd>
            </dl>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah Pembelian (tCO2e)</label>
              <input
                type="number"
                max={buyTarget.available}
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs space-y-1">
              <div>Subtotal: ${usd(subtotal)} USDC</div>
              <div>Fee Marketplace (0.5%): ${usd(fee)} USDC</div>
              <div className="font-bold text-sm pt-1 border-t border-indigo-200/50">
                Total Pembayaran: ${usd(totalCost)} USDC
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBuyTarget(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBuy}
                className="flex-1 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700"
              >
                Konfirmasi Beli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Buat Listing Kredit Karbon Baru</h3>
            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Token Portofolio</label>
                <select
                  value={listTokenCode}
                  onChange={(e) => setListTokenCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {holdings.map((h) => (
                    <option key={h.code} value={h.code}>
                      {h.code} (Saldo: {fmt(h.balance)} tCO2e)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Jumlah Dijual (tCO2e)</label>
                <input
                  type="number"
                  value={listAmount}
                  onChange={(e) => setListAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Harga per Unit (USDC)</label>
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
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700"
                >
                  Listing ke Pasar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

