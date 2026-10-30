// Pazar: ziyaretçinin ülkesine göre içerik (dil değil — dili locale belirler).
// Ülke Vercel'in x-vercel-ip-country header'ından gelir; middleware bunu cvz_country
// çerezine de yazar ki client bileşenler (uygulama içi iş arama) okuyabilsin.

export type Market = 'se' | 'local' | 'intl';
export type JobSource = 'platsbanken' | 'iskur' | 'arbeitsagentur' | 'infojobs' | 'link';

export const COUNTRY_COOKIE = 'cvz_country';

// middleware.ts'teki COUNTRY_LOCALE ile aynı liste
export const SPANISH_COUNTRIES = ['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC'];
export const GERMAN_COUNTRIES = ['DE', 'AT', 'CH', 'LI'];

// Ülke bilinmiyorsa: İsveççe sayfa İsveç içeriğini korur (Googlebot dahil), diğerleri nötr.
export function marketFor(country: string, locale: string): Market {
  if (country === 'SE') return 'se';
  if (country === 'TR' || SPANISH_COUNTRIES.includes(country) || GERMAN_COUNTRIES.includes(country)) return 'local';
  return locale === 'sv' ? 'se' : 'intl';
}

// Uygulama içi iş aramanın varsayılan kaynağı. Ülke yoksa eski davranış (dile göre).
export function defaultJobSource(country: string, locale: string): JobSource {
  if (country === 'SE') return 'platsbanken';
  if (country === 'TR') return 'iskur';
  if (country === 'DE') return 'arbeitsagentur';
  if (country === 'ES') return 'infojobs';
  if (country) return 'link';
  if (locale === 'tr') return 'iskur';
  if (locale === 'de') return 'arbeitsagentur';
  if (locale === 'sv') return 'platsbanken';
  return 'link';
}

export function readCountryCookie(): string {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp(`(?:^|; )${COUNTRY_COOKIE}=([A-Z]{2})`));
  return m ? m[1] : '';
}
