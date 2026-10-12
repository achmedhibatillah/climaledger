'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  isLocaleCode,
  resources,
  type LocaleCode,
} from './i18n.config';

export type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (next: LocaleCode) => void;
  t: (key: string, fallback?: string) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Realtime locale switching: tidak ada reload, tidak ada refetch dari server.
 * Semua resource bahasa sudah di-bundle (lihat i18n.config.ts), jadi berpindah
 * bahasa hanya memicu re-render React biasa lewat perubahan context state.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  // Hydrate dari localStorage sekali saat mount (client-only, hindari SSR mismatch)
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocaleCode(saved)) setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      return resources[locale]?.[key] ?? resources[DEFAULT_LOCALE]?.[key] ?? fallback ?? key;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
