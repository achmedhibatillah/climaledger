'use client';

import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './I18nProvider';

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n() harus dipakai di dalam <I18nProvider>. Bungkus root layout.tsx.');
  }
  return ctx;
}
