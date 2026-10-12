'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n, LocaleCode } from '../lib/i18n';
import { api } from '../lib/api';

export function Topbar() {
  const { locale, setLocale, t } = useI18n();
  const [profile, setProfile] = useState<any>({
    name: 'PT Nusantara Hijau Abadi',
    network: 'devnet',
    usdcBalance: 45200.0,
    walletAddress: '8TqMPxZ72N4Vp9aB8dFa3J4K98La111111111111',
  });

  useEffect(() => {
    api.getProfile()
      .then((data) => setProfile(data))
      .catch(() => {});
  }, []);

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  };

  const shortAddr = (addr: string) => {
    if (!addr) return '';
    return addr.length > 10 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-3">
        <div className="font-bold text-slate-900 truncate">
          {profile.name}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Network Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            <i className="w-1.5 h-1.5 rounded-full bg-sol-500 inline-block" />
            Solana {profile.network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </div>

          {/* USDC Balance */}
          <div className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
            USDC {formatUsd(profile.usdcBalance)}
          </div>

          {/* Locale Switcher */}
          <div className="inline-flex rounded-full border border-slate-200 overflow-hidden text-xs font-bold">
            <button
              type="button"
              onClick={() => setLocale('id')}
              className={`px-2.5 py-1.5 transition ${
                locale === 'id' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-2.5 py-1.5 transition ${
                locale === 'en' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              EN
            </button>
          </div>

          {/* Wallet Button */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {shortAddr(profile.walletAddress)} {t('wallet_demo')}
          </Link>
        </div>
      </div>
    </header>
  );
}

