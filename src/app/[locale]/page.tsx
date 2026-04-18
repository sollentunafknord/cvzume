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

const JSON_LD: Record<string, object> = {
  sv: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'CVzume',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon.png` },
        description: 'AI-drivet CV-verktyg för den svenska arbetsmarknaden.',
        sameAs: ['https://www.linkedin.com/company/cvzume'],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'CVzume',
        publisher: { '@id': `${BASE_URL}/#organization` },
        inLanguage: ['sv', 'en', 'es', 'tr'],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Är CVzume gratis?', acceptedAnswer: { '@type': 'Answer', text: 'Ja, CVzume är gratis att använda med 2 CV-genereringar per månad. Pro-planen kostar 109 kr/mån och ger obegränsad användning.' } },
          { '@type': 'Question', name: 'Hur fungerar AI-anpassningen?', acceptedAnswer: { '@type': 'Answer', text: 'CVzume läser jobbannonsen och jämför den med din profil. AI:n identifierar nyckelord och krav och skriver ett anpassat CV-sammandrag och personligt brev på några sekunder.' } },
          { '@type': 'Question', name: 'Vilka språk stöds?', acceptedAnswer: { '@type': 'Answer', text: 'CVzume stöder svenska, engelska, spanska och turkiska. AI:n genererar alltid text på samma språk som jobbannonsen.' } },
          { '@type': 'Question', name: 'Är mina uppgifter säkra?', acceptedAnswer: { '@type': 'Answer', text: 'Ja. All data lagras inom EU och hanteras i enlighet med GDPR. Du äger alltid dina uppgifter och kan radera kontot när som helst.' } },
        ],
      },
    ],
  },
  en: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'CVzume',
        url: BASE_URL,
        logo: { '@type': 'ImageObject', url: `${BASE_URL}/icon.png` },
        description: 'AI-powered CV builder for the Swedish job market.',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Is CVzume free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, CVzume is free with 2 CV generations per month. The Pro plan costs 109 SEK/month for unlimited use.' } },
          { '@type': 'Question', name: 'How does AI tailoring work?', acceptedAnswer: { '@type': 'Answer', text: 'CVzume reads the job ad and compares it to your profile. The AI identifies keywords and requirements and writes a tailored CV summary and cover letter in seconds.' } },
          { '@type': 'Question', name: 'Is my data secure?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. All data is stored within the EU and handled in accordance with GDPR. You own your data and can delete your account at any time.' } },
        ],
      },
    ],
  },
};

export default async function LocalePage({ params }: Props) {
  const { locale } = await params;
  const jsonLd = JSON_LD[locale] ?? JSON_LD.sv;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  );
}
