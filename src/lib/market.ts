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

// "Açık ilanlarda ara" düğmesi: ziyaretçinin ülkesindeki kamu iş kurumu. Uygulama içinde aranabilenler
// (inApp) iş arama sayfasında ilgili sekmeyi açar; diğerleri kurumun sitesini yeni sekmede açar,
// kullanıcı ilanı bulup linkini yapıştırır.
export type JobAgency = { name: string; inApp?: JobSource; url?: string }

const EURES = 'https://europa.eu/eures/portal/jv-se/home'
const AGENCIES: Record<string, JobAgency> = {
  SE: { name: 'Arbetsförmedlingen', inApp: 'platsbanken' },
  TR: { name: 'İŞKUR', inApp: 'iskur' },
  DE: { name: 'Bundesagentur für Arbeit', inApp: 'arbeitsagentur' },
  ES: { name: 'España', inApp: 'infojobs' },
  AT: { name: 'AMS', url: 'https://jobs.ams.at/public/emps/' },
  CH: { name: 'Job-Room', url: 'https://www.job-room.ch' },
  NO: { name: 'NAV', url: 'https://arbeidsplassen.nav.no/stillinger' },
  DK: { name: 'Jobnet', url: 'https://job.jobnet.dk/CV/FindWork' },
  FI: { name: 'Työmarkkinatori', url: 'https://tyomarkkinatori.fi' },
  GB: { name: 'Find a job (GOV.UK)', url: 'https://findajob.dwp.gov.uk' },
  IE: { name: 'JobsIreland', url: 'https://jobsireland.ie' },
  US: { name: 'CareerOneStop', url: 'https://www.careeronestop.org/Toolkit/Jobs/find-jobs.aspx' },
  FR: { name: 'France Travail', url: 'https://candidat.francetravail.fr/offres/recherche' },
  NL: { name: 'werk.nl', url: 'https://www.werk.nl/werkzoekenden/vacatures/' },
  PL: { name: 'praca.gov.pl', url: 'https://oferty.praca.gov.pl' },
  MX: { name: 'Portal del Empleo', url: 'https://www.empleo.gob.mx' },
}
const EU = ['BE', 'BG', 'CY', 'CZ', 'EE', 'GR', 'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'PT', 'RO', 'SI', 'SK']

export function jobAgency(country: string, locale: string): JobAgency | null {
  if (AGENCIES[country]) return AGENCIES[country]
  if (EU.includes(country)) return { name: 'EURES', url: EURES }
  if (country) return null
  // Ülke bilinmiyor: dile göre (eski davranış)
  return locale === 'sv' ? AGENCIES.SE : locale === 'tr' ? AGENCIES.TR : locale === 'de' ? AGENCIES.DE : null
}

/** İş aramadan "Analiz et" denince dönülecek sayfa: rehberli akış (ana sayfa); eski "Ny ansökan"dan gelindiyse oraya. */
export const RETURN_KEY = 'cvzume_return'
export function applyPath(locale: string): string {
  let target = 'akis'
  try { if (localStorage.getItem(RETURN_KEY) === 'ny') target = 'ny' } catch { /* yok */ }
  return `/${locale}/${target}`
}
