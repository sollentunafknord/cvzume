import type { Metadata } from 'next';
import { getMessages } from 'next-intl/server';
import { headers } from 'next/headers';
import LandingClient from './LandingClient';
import { marketFor, type Market } from '@/lib/market';

const BASE_URL = 'https://www.cvzume.com';

const META: Record<string, { title: string; description: string; keywords: string; ogLocale: string }> = {
  sv: {
    title: 'CVzume — Skapa CV med AI för svenska jobb | Gratis CV-mall',
    description: 'Skapa ett professionellt CV och personligt brev på minuter med AI. CVzume anpassar ditt CV till varje jobbannons automatiskt. Gratis att börja — perfekt för den svenska arbetsmarknaden.',
    keywords: 'CV mall, skapa CV, CV Sverige, AI CV, personligt brev, jobbansökan Sverige, CV-hjälp, CV-verktyg, gratis CV-mall, CV-generator',
    ogLocale: 'sv_SE',
  },
  en: {
    title: 'CVzume — Create Your CV with AI for Swedish Jobs | Free Template',
    description: 'Build a professional CV and cover letter in minutes with AI. CVzume tailors your CV to every job ad automatically. Free to start — built for the Swedish job market.',
    keywords: 'CV template, create CV, CV Sweden, AI resume, cover letter, job application Sweden, resume builder, free CV template, CV generator',
    ogLocale: 'en_US',
  },
  es: {
    title: 'CVzume — CV y carta de presentación con IA para cada oferta | Empieza gratis',
    description: 'Pega la oferta de trabajo o su enlace y la IA crea en minutos un resumen de CV y una carta de presentación a medida. En España, Latinoamérica o Suecia. Empieza gratis.',
    keywords: 'crear CV, CV con IA, carta de presentación, solicitud de empleo, plantilla CV gratis, CV Suecia',
    ogLocale: 'es_ES',
  },
  tr: {
    title: 'CVzume — Yapay Zeka ile Her İlana Özel CV ve Ön Yazı | Ücretsiz Başla',
    description: "İş ilanını ya da linkini yapıştır, yapay zeka dakikalar içinde ilana özel CV özeti ve ön yazı hazırlasın. Türkiye'de, İsveç'te ya da başka bir ülkede iş arıyor olsan da. Ücretsiz başla.",
    keywords: 'CV oluştur, yapay zeka CV, ön yazı örneği, iş başvurusu, CV hazırlama, ücretsiz CV, İsveç CV, İŞKUR',
    ogLocale: 'tr_TR',
  },
  de: {
    title: 'CVzume — Lebenslauf und Anschreiben mit KI für jede Stelle | Kostenlos starten',
    description: 'Fügen Sie die Stellenanzeige oder den Link ein — die KI erstellt in wenigen Minuten ein passendes Lebenslauf-Profil und Anschreiben. In Deutschland, Österreich, der Schweiz oder Schweden. Kostenlos starten.',
    keywords: 'Lebenslauf erstellen, Anschreiben, Bewerbung schreiben, KI Lebenslauf, Lebenslauf Vorlage kostenlos, Bewerbung KI, CV Schweden',
    ogLocale: 'de_DE',
  },
};

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ market?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale] ?? META.sv;

  return {
    title: m.title,
    description: m.description,
    keywords: m.keywords,
    authors: [{ name: 'CVzume' }],
    robots: 'index, follow',
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        sv: `${BASE_URL}/sv`,
        en: `${BASE_URL}/en`,
        es: `${BASE_URL}/es`,
        tr: `${BASE_URL}/tr`,
        de: `${BASE_URL}/de`,
        'x-default': `${BASE_URL}/sv`,
      },
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: `${BASE_URL}/${locale}`,
      type: 'website',
      locale: m.ogLocale,
      siteName: 'CVzume',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      site: '@cvzume',
    },
  };
}

function jsonLd(locale: string, faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'CVzume',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon.png` },
        email: 'info@cvzume.com',
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'CVzume',
        publisher: { '@id': `${BASE_URL}/#organization` },
        inLanguage: ['sv', 'en', 'es', 'tr', 'de'],
      },
      {
        '@type': 'FAQPage',
        inLanguage: locale,
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

export default async function LocalePage({ params, searchParams }: Props) {
  const { locale } = await params;
  // ?market=se|local|intl för att förhandsgranska varianterna
  const forced = (await searchParams).market;
  const country = (await headers()).get('x-vercel-ip-country') ?? '';
  const market: Market = forced === 'se' || forced === 'local' || forced === 'intl' ? forced : marketFor(country, locale);
  const messages = (await getMessages()) as { landing: { faq: { items: { q: string; a: string }[] } } };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale, messages.landing.faq.items)) }}
      />
      <LandingClient market={market} />
    </>
  );
}
