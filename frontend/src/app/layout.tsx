import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { ToastProvider } from '../components/Toast';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const metadata: Metadata = {
  title: 'ClimaLedger — Carbon Ops Dashboard',
  description: 'Enterprise ESG Carbon Ops & Solana Blockchain Tokenization Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <I18nProvider>
          <ToastProvider>
            <div className="min-h-screen flex">
              <Sidebar />
              <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
                <Topbar />
                <main className="px-4 md:px-8 py-6 max-w-[1320px] w-full mx-auto flex-1">
                  {children}
                </main>
              </div>
            </div>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

