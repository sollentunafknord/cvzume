// Rehberli başvuru akışının adresi her dilde kendi kelimesiyle (sayfa dosyası /[locale]/akis;
// next.config.ts bu adresleri oraya yönlendirir, eski /<dil>/akis adresleri buraya döner).
export const FLOW_SLUG: Record<string, string> = { tr: 'basvuru', sv: 'ansok', en: 'apply', es: 'solicitud', de: 'bewerbung' }
export const flowPath = (locale: string) => `/${locale}/${FLOW_SLUG[locale] ?? 'akis'}`
