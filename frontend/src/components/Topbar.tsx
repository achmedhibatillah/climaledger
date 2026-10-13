'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '../lib/i18n';
import { useSidebar } from '../lib/sidebar';
import { api } from '../lib/api';

export function Topbar() {
  const { locale, setLocale, t } = useI18n();
  const { collapsed, toggleCollapsed, toggleMobileOpen } = useSidebar();
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
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const shortAddr = (addr: string) => {
    if (!addr) return '';
    return addr.length > 8 ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : addr;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2 sm:gap-4 flex-nowrap w-full">
        {/* Left Side: Collapse/Mobile Hamburger Toggle & Profile Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {/* Desktop Sidebar Collapse Toggle */}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden md:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs shrink-0"
            title={collapsed ? t('sidebar_expand', 'Expand navigation') : t('sidebar_collapse', 'Collapse navigation')}
            aria-label="Toggle navigation collapse"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M15 9l-3 3 3 3" />
            </svg>
          </button>

          {/* Mobile Hamburger Drawer Toggle */}
          <button
            type="button"
            onClick={toggleMobileOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs shrink-0"
            aria-label="Open mobile navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="font-bold text-slate-900 truncate text-xs sm:text-sm md:text-base max-w-[120px] xs:max-w-[170px] sm:max-w-[260px] md:max-w-none">
            {profile.name}
          </div>
        </div>

        {/* Right Side: Network Badge, USDC Balance, Language Switcher, Wallet */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Solana Network Badge (tablet & desktop) */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-600">
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
            <span className="hidden md:inline">Solana </span>{profile.network === 'devnet' ? 'Devnet' : 'Mainnet'}
          </div>

          {/* USDC Balance (large desktop) */}
          <div className="hidden lg:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs">
            USDC {formatUsd(profile.usdcBalance)}
          </div>

          {/* Language Switcher */}
          <div className="inline-flex rounded-full border border-slate-200 overflow-hidden text-xs font-bold bg-white shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setLocale('id')}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 transition text-[11px] sm:text-xs ${
                locale === 'id' ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-100'
              }`}
              title="Bahasa Indonesia"
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-2 sm:px-2.5 py-1 sm:py-1.5 transition text-[11px] sm:text-xs ${
                locale === 'en' ? 'bg-slate-900 text-white' : 'bg-transparent text-slate-500 hover:bg-slate-100'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* Wallet Button */}
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs shrink-0"
          >
            <i className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span>{shortAddr(profile.walletAddress)}</span>
            <span className="opacity-70 hidden sm:inline">{t('wallet_demo')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
