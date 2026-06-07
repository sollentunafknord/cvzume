import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.cvzume.com';
const LOCALES = ['sv', 'en', 'es', 'tr'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const landingPages = LOCALES.map(locale => ({
    url: `${BASE_URL}/${locale}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: locale === 'sv' ? 1.0 : 0.9,
    alternates: {
      languages: Object.fromEntries(LOCALES.map(l => [l, `${BASE_URL}/${l}`])),
    },
  }));

  const authPages = LOCALES.map(locale => ({
    url: `${BASE_URL}/${locale}/auth`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const GUIDE_SLUGS = [
    'personligt-brev-exempel',
    'cv-mall',
    'cv-for-nyanlanda',
    'vanliga-intervjufragor',
  ];
  const guidePages = GUIDE_SLUGS.map(slug => ({
    url: `${BASE_URL}/sv/guide/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...landingPages, ...authPages, ...guidePages];
}
