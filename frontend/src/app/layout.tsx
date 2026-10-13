import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { I18nProvider } from '../lib/i18n';
import { ToastProvider } from '../components/Toast';
import { SidebarProvider } from '../lib/sidebar';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const metadata: Metadata = {
  title: 'ClimaLedger — Carbon Ops Dashboard',
  description: 'Enterprise ESG Carbon Ops & Solana Blockchain Tokenization Platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="bg-slate-50 text-slate-900 min-h-full flex flex-col antialiased overflow-x-hidden">
        <I18nProvider>
          <ToastProvider>
            <SidebarProvider>
              <div className="min-h-screen flex flex-row w-full max-w-full">
                {/* Desktop & Mobile Responsive Sidebar Drawer & Bottom Nav */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex-1 min-w-0 flex flex-col min-h-screen w-full pb-20 md:pb-0">
                  <Topbar />
                  <main className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 max-w-[1320px] w-full mx-auto flex-1">
                    {children}
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
