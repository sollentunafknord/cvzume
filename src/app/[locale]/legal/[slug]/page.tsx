import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { notFound } from 'next/navigation';
import { getLegal, SLUGS, UPDATED, CONTACT, type LegalSlug } from '../content';

const BASE_URL = 'https://www.cvzume.com';
const LOCALES = ['sv', 'en', 'es', 'tr'];

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return LOCALES.flatMap(locale => SLUGS.map(slug => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as LegalSlug)) return {};
  const doc = getLegal(locale, slug as LegalSlug);
  return {
    title: `${doc.title} — CVzume`,
    description: doc.lead,
    alternates: { canonical: `${BASE_URL}/${locale === 'sv' ? 'sv' : 'en'}/legal/${slug}` },
  };
}

const BACK: Record<string, string> = { sv: '← Till startsidan', en: '← Back to home', es: '← Volver al inicio', tr: '← Ana sayfaya dön' };
const UPDATED_LABEL: Record<string, string> = { sv: 'Senast uppdaterad', en: 'Last updated', es: 'Última actualización', tr: 'Son güncelleme' };
const QUESTIONS: Record<string, string> = { sv: 'Frågor? Mejla', en: 'Questions? Email', es: '¿Preguntas? Escribe a', tr: 'Sorular için:' };

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!SLUGS.includes(slug as LegalSlug)) notFound();
  const doc = getLegal(locale, slug as LegalSlug);

  return (
    <main style={s.main}>
      <a href={`/${locale}`} style={s.link}>{BACK[locale] ?? BACK.en}</a>
      <nav style={s.tabs}>
        {SLUGS.map(other => (
          <a key={other} href={`/${locale}/legal/${other}`} style={other === slug ? { ...s.tab, ...s.tabActive } : s.tab}>
            {getLegal(locale, other).title}
          </a>
        ))}
      </nav>
      <h1 style={s.h1}>{doc.title}</h1>
      <p style={s.meta}>{UPDATED_LABEL[locale] ?? UPDATED_LABEL.en}: {UPDATED}</p>
      <p style={s.lead}>{doc.lead}</p>
      {doc.sections.map(sec => (
        <section key={sec.h}>
          <h2 style={s.h2}>{sec.h}</h2>
          {sec.p.map(p => <p key={p} style={s.p}>{p}</p>)}
        </section>
      ))}
      <p style={{ ...s.p, marginTop: 40 }}>
        {QUESTIONS[locale] ?? QUESTIONS.en} <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a>
      </p>
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: { maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px', fontFamily: "'DM Sans', system-ui, Arial, sans-serif", color: '#1E293B', lineHeight: 1.7 },
  link: { color: '#2563EB', textDecoration: 'none', fontSize: 14 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', margin: '24px 0 8px' },
  tab: { fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none', border: '1px solid #E2E8F0', borderRadius: 100, padding: '5px 12px' },
  tabActive: { color: 'white', background: '#2563EB', borderColor: '#2563EB' },
  h1: { fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.2, color: '#0D1B2A', margin: '20px 0 4px', fontWeight: 400 },
  meta: { fontSize: 13, color: '#94A3B8', margin: '0 0 20px' },
  lead: { fontSize: 18, color: '#334155' },
  h2: { fontSize: 20, color: '#0D1B2A', margin: '32px 0 8px' },
  p: { margin: '0 0 12px', fontSize: 15 },
};
