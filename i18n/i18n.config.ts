import id from './locales/id.json';
import en from './locales/en.json';

/**
 * Config-driven locale registry. Menambah bahasa baru cukup:
 * 1. Tambah file JSON di ./locales/<code>.json
 * 2. Import + daftarkan di `resources` dan `AVAILABLE_LOCALES` di bawah ini
 * Tidak ada perubahan di komponen manapun yang memanggil useI18n().
 */
export type LocaleCode = 'id' | 'en';

export const DEFAULT_LOCALE: LocaleCode = 'id';
export const STORAGE_KEY = 'climaledger.locale';

export const AVAILABLE_LOCALES: { code: LocaleCode; label: string }[] = [
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
];

export const resources: Record<LocaleCode, Record<string, string>> = { id, en };

export function isLocaleCode(v: string | null): v is LocaleCode {
  return !!v && v in resources;
}
