'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { idTranslations, enTranslations, TranslationDict } from './translations';

export type LocaleCode = 'id' | 'en';

const dictionaries: Record<LocaleCode, TranslationDict> = {
  id: idTranslations,
  en: enTranslations,
};

interface I18nContextType {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: string, fallback?: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'climaledger.locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>('id');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode;
      if (saved === 'id' || saved === 'en') {
        setLocaleState(saved);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = saved;
        }
      } else if (typeof document !== 'undefined') {
        document.documentElement.lang = 'id';
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = next;
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const localized = dictionaries[locale]?.[key];
      if (localized !== undefined) {
        return localized;
      }

      // Fallback to English if missing in current locale
      const enFallback = dictionaries.en?.[key];
      if (enFallback !== undefined) {
        return enFallback;
      }

      // Log warning if key is missing in all dictionaries
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing key: "${key}" for locale "${locale}"`);
      }

      return fallback ?? key;
    },
    [locale],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      const intlLocale = locale === 'id' ? 'id-ID' : 'en-US';
      return new Intl.NumberFormat(intlLocale, options).format(value);
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (value: number, currency = 'USD'): string => {
      const intlLocale = locale === 'id' ? 'id-ID' : 'en-US';
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [locale],
  );

  const formatDate = useCallback(
    (value: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const dateObj = typeof value === 'object' ? value : new Date(value);
      const intlLocale = locale === 'id' ? 'id-ID' : 'en-US';
      const defaultOpts: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat(intlLocale, options || defaultOpts).format(dateObj);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      formatNumber,
      formatCurrency,
      formatDate,
    }),
    [locale, setLocale, t, formatNumber, formatCurrency, formatDate],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
