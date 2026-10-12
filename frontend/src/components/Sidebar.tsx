'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../lib/i18n';

interface NavItem {
  key: string;
  href: string;
  labelKey: string;
  icon: (active: boolean) => React.ReactNode;
}

interface NavGroup {
  groupKey: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  const groups: NavGroup[] = [
    {
      groupKey: 'grp_overview',
      items: [
        {
          key: 'dashboard',
          href: '/dashboard',
          labelKey: 'nav_dashboard',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
            </svg>
          ),
        },
      ],
    },
    {
      groupKey: 'grp_emission',
      items: [
        {
          key: 'tracker',
          href: '/tracker',
          labelKey: 'nav_tracker',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          key: 'assess',
          href: '/assess',
          labelKey: 'nav_assess',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupKey: 'grp_credit',
      items: [
        {
          key: 'tokenize',
          href: '/tokenize',
          labelKey: 'nav_tokenize',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        },
        {
          key: 'market',
          href: '/market',
          labelKey: 'nav_market',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          ),
        },
        {
          key: 'portfolio',
          href: '/portfolio',
          labelKey: 'nav_portfolio',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      groupKey: 'grp_compliance',
      items: [
        {
          key: 'audit',
          href: '/audit',
          labelKey: 'nav_audit',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          ),
        },
        {
          key: 'settings',
          href: '/settings',
          labelKey: 'nav_settings',
          icon: () => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-950 text-slate-300 transition-all duration-200 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-emerald-900/40 p-0.5">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="76,8 48,12 20,32" fill="#16234F" />
              <polygon points="76,8 20,32 10,58" fill="#1E3A8A" />
              <polygon points="76,8 10,58 26,82" fill="#94A3B8" />
              <polygon points="76,8 26,82 46,92" fill="#16234F" />
              <polygon points="76,8 92,40 86,66" fill="#10B981" />
              <polygon points="76,8 86,66 64,84" fill="#6EE7B7" />
              <polygon points="76,8 64,84 46,92" fill="#065F46" />
              <path d="M76,8 Q66,50 46,92" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-white font-extrabold tracking-tight text-[15px] whitespace-nowrap overflow-hidden">
              ClimaLedger
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          title="Toggle sidebar"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="px-3 mt-4 space-y-4 text-sm font-medium flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.groupKey} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t(group.groupKey)}
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                    active
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? t(item.labelKey) : undefined}
                >
                  <span className="shrink-0">{item.icon(active)}</span>
                  {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      {!collapsed && (
        <div className="mt-auto p-4 space-y-2 border-t border-white/10 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">{t('kyb')}</span>
            <b className="text-emerald-400">{t('kyb_pass')}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('iso')}</span>
            <b className="text-emerald-400">{t('iso_pass')}</b>
          </div>
        </div>
      )}
    </aside>
  );
}

