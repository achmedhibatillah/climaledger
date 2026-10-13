'use client';

import React, { useEffect, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { KybStep } from '../../types';

export default function SettingsPage() {
  const { t, formatCurrency } = useI18n();
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
      showToast(t('toast_kyb_approved'));
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyetujui langkah KYB');
    }
  };

  const handleSimulateUpload = async (id: string) => {
    try {
      await api.uploadKyb(id, `dokumen_${id}_reupload.pdf`);
      showToast(t('toast_kyb_reuploaded'));
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah dokumen');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(profile.walletAddress);
    showToast(t('toast_address_copied'));
  };

  const usd = (n: number) => formatCurrency(n, 'USD');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings_title')}</h2>
        <p className="text-sm text-slate-500">{t('settings_sub')}</p>
      </div>

      {/* KYB Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{t('kyb_card_title')}</h3>
            <p className="text-xs text-slate-400">{t('kyb_card_desc')}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1">
            {t('kyb_100_verified')}
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
                  type="button"
                  onClick={() => handleSimulateUpload(step.id)}
                  className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                >
                  {t('btn_reupload')}
                </button>
                {step.status !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => handleSimulateApprove(step.id)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
                  >
                    {t('btn_approve')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <h3 className="font-bold text-slate-900">{t('wallet_card_title')}</h3>
        <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
          <dt className="text-slate-400">{t('wallet_status_label')}</dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {t('wallet_demo_mode')}
            </span>
          </dd>

          <dt className="text-slate-400">{t('public_address_label')}</dt>
          <dd className="mono break-all font-semibold text-slate-800 flex items-center gap-2">
            <span>{profile.walletAddress}</span>
            <button type="button" onClick={copyAddress} className="text-emerald-700 text-xs font-bold">
              {t('btn_copy')}
            </button>
          </dd>

          <dt className="text-slate-400">{t('network_rpc_label')}</dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold bg-white">
              <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Solana Devnet (127.0.0.1:8899 / Devnet)
            </span>
          </dd>

          <dt className="text-slate-400">{t('cash_balance_label')}</dt>
          <dd className="font-black mono text-emerald-700 text-base">
            {usd(profile.usdcBalance)} USDC
          </dd>
        </dl>

        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
          {t('wallet_explainer')}
        </p>
      </div>

      {/* Company Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft space-y-4">
        <h3 className="font-bold text-slate-900">{t('company_profile_title')}</h3>
        <dl className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
          <dt className="text-slate-400">{t('label_company_name')}</dt>
          <dd className="font-bold text-slate-900">{profile.name}</dd>

          <dt className="text-slate-400">{t('label_industry_sector')}</dt>
          <dd className="text-slate-700">{profile.sector}</dd>

          <dt className="text-slate-400">{t('label_reporting_period')}</dt>
          <dd className="text-slate-700">{profile.reportingPeriod}</dd>

          <dt className="text-slate-400">{t('label_reg_number')}</dt>
          <dd className="mono text-xs text-slate-600">{profile.registrationNumber}</dd>
        </dl>
      </div>
    </div>
  );
}
