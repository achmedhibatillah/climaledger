'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { KybStep } from '../../types';

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { showToast } = useToast();

  const [kybSteps, setKybSteps] = useState<KybStep[]>([]);
  const [profile, setProfile] = useState<any>({
    name: 'PT Nusantara Hijau Abadi',
    sector: 'Manufaktur & Energi',
    reportingPeriod: '2024 (YTD)',
    registrationNumber: 'AHU-0012948.AH.01.01.2021',
    walletAddress: '8TqMPxZ72N4Vp9aB8dFa3J4K98La111111111111',
    network: 'devnet',
    usdcBalance: 45200.0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [kList, prof] = await Promise.all([
        api.getKybSteps(),
        api.getProfile(),
      ]);
      setKybSteps(kList);
      setProfile(prof);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateApprove = async (id: string) => {
    try {
      await api.approveKyb(id);
      showToast(`Langkah KYB (${id.toUpperCase()}) disetujui!`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyetujui langkah KYB');
    }
  };

  const handleSimulateUpload = async (id: string) => {
    try {
      await api.uploadKyb(id, `dokumen_${id}_reupload.pdf`);
      showToast(`Dokumen (${id.toUpperCase()}) berhasil diunggah ulang!`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah dokumen');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(profile.walletAddress);
    showToast('Alamat wallet disalin!');
  };

  const usd = (n: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Perusahaan & Kepatuhan</h2>
        <p className="text-sm text-slate-500">
          Kelola verifikasi KYB badan usaha, integrasi Phantom wallet Solana, dan profil entitas
        </p>
      </div>

      {/* KYB Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Status Verifikasi KYB (Know Your Business)</h3>
            <p className="text-xs text-slate-400">
              Diperlukan untuk kepatuhan anti-pencucian uang dan penerbitan kredit karbon sah
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1">
            ✓ 100% Terverifikasi
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {kybSteps.map((step) => (
            <div
              key={step.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                    step.status === 'verified'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {step.status === 'verified' ? '✓' : '…'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{step.name}</div>
                  <div className="text-xs text-slate-400">{step.detail}</div>
                  {step.file && (
                    <div className="text-[11px] mono text-emerald-700 mt-1">File: {step.file}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleSimulateUpload(step.id)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  Unggah Ulang
                </button>
                {step.status !== 'verified' && (
                  <button
                    onClick={() => handleSimulateApprove(step.id)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    Setujui
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <h3 className="font-bold text-slate-900">Koneksi Phantom Wallet (Solana)</h3>
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <dt className="text-slate-400">Status</dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Terhubung (Mode Demo / Phantom)
            </span>
          </dd>

          <dt className="text-slate-400">Alamat Publik</dt>
          <dd className="mono break-all font-semibold text-slate-800 flex items-center gap-2">
            <span>{profile.walletAddress}</span>
            <button onClick={copyAddress} className="text-emerald-700 text-xs font-bold">
              Salin
            </button>
          </dd>

          <dt className="text-slate-400">Jaringan RPC</dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold bg-white">
              <i className="w-1.5 h-1.5 rounded-full bg-sol-500 inline-block" />
              Solana Devnet (127.0.0.1:8899 / Devnet)
            </span>
          </dd>

          <dt className="text-slate-400">Saldo Kas (USDC)</dt>
          <dd className="font-black mono text-emerald-700 text-base">
            ${usd(profile.usdcBalance)} USDC
          </dd>
        </dl>

        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          Dengan Phantom terpasang di browser, transaksi lock, mint, dan retire akan meminta otorisasi tanda tangan pesan langsung dari ekstensi wallet Anda.
        </p>
      </div>

      {/* Company Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <h3 className="font-bold text-slate-900">Profil Organisasi & Pelaporan</h3>
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
          <dt className="text-slate-400">Nama Perusahaan</dt>
          <dd className="font-bold text-slate-900">{profile.name}</dd>

          <dt className="text-slate-400">Sektor Industri</dt>
          <dd className="text-slate-700">{profile.sector}</dd>

          <dt className="text-slate-400">Periode Pelaporan</dt>
          <dd className="text-slate-700">{profile.reportingPeriod}</dd>

          <dt className="text-slate-400">No. Registrasi / AHU</dt>
          <dd className="mono text-xs text-slate-600">{profile.registrationNumber}</dd>
        </dl>
      </div>
    </div>
  );
}

