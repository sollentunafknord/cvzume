import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sv', '/en', '/es', '/tr', '/sv/auth', '/en/auth', '/es/auth', '/tr/auth'],
        disallow: [
          '/*/dashboard',
          '/*/profile',
          '/*/cv',
          '/*/letter',
          '/*/settings',
          '/*/archive',
          '/*/upgrade',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://www.cvzume.com/sitemap.xml',
  };
}
