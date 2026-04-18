import type { Metadata } from 'next';
import LandingClient from './LandingClient';

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
    title: 'CVzume — Crea tu CV con IA para empleos en Suecia | Plantilla gratis',
    description: 'Crea un CV profesional y carta de presentación en minutos con IA. CVzume adapta tu CV a cada oferta de trabajo automáticamente. Gratis para empezar.',
    keywords: 'plantilla CV, crear CV, CV Suecia, CV con IA, carta presentación, solicitud empleo Suecia, generador CV gratis',
    ogLocale: 'es_ES',
  },
  tr: {
    title: 'CVzume — İsveç İşleri için Yapay Zeka ile CV Oluştur | Ücretsiz Şablon',
    description: "Dakikalar içinde profesyonel CV ve ön yazı oluşturun. CVzume, CV'nizi her iş ilanına otomatik olarak uyarlar. Ücretsiz başlayın — İsveç iş piyasası için tasarlandı.",
    keywords: 'CV şablonu, CV oluştur, İsveç CV, yapay zeka CV, ön yazı, İsveç iş başvurusu, ücretsiz CV şablonu',
    ogLocale: 'tr_TR',
  },
};

type Props = { params: Promise<{ locale: string }> };

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

export default function LocalePage() {
  return <LandingClient />;
}
