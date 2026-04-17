import type { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'CVzume — Skapa CV med AI för svenska jobb | Gratis CV-mall',
  description: 'Skapa ett professionellt CV och personligt brev på minuter med AI. CVzume anpassar ditt CV till varje jobbannons automatiskt. Gratis att börja — perfekt för den svenska arbetsmarknaden.',
  keywords: 'CV mall, skapa CV, CV Sverige, AI CV, personligt brev, jobbansökan Sverige, CV-hjälp, CV-verktyg, gratis CV-mall, CV-generator',
  authors: [{ name: 'CVzume' }],
  robots: 'index, follow',
  openGraph: {
    title: 'CVzume — Skapa CV med AI för svenska jobb',
    description: 'Skapa ett professionellt CV och personligt brev på minuter med AI. Anpassas automatiskt till varje jobbannons. Gratis att börja.',
    url: 'https://www.cvzume.com/',
    type: 'website',
    locale: 'sv_SE',
    siteName: 'CVzume',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CVzume — Skapa CV med AI för svenska jobb',
    description: 'Skapa ett professionellt CV på minuter med AI. Gratis att börja.',
    site: '@cvzume',
  },
};

export default function LocalePage() {
  return <LandingClient />;
}