'use client';

import { AVAILABLE_LOCALES } from './i18n.config';
import { useI18n } from './useI18n';

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex rounded-full border border-slate-200 overflow-hidden text-xs font-bold">
      {AVAILABLE_LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          aria-pressed={locale === l.code}
          className={
            'px-2.5 py-1.5 transition ' +
            (locale === l.code ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

/* Pemakaian di komponen manapun:
 *   const { t, locale } = useI18n();
 *   <h1>{t('kpi_emissions')}</h1>
 *
 * Pasang <I18nProvider> sekali di app/layout.tsx:
 *   <I18nProvider><LocaleSwitcher />{children}</I18nProvider>
 */
