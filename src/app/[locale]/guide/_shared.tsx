// Ortak guide (SEO rehber) yapı taşları — tüm /sv/guide/* sayfaları bunu kullanır.
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';

export const BASE_URL = 'https://www.cvzume.com';
export const REGISTER_URL = `${BASE_URL}/sv/auth#register`;

export type Faq = { q: string; a: string };

export function guideMetadata(opts: {
  slug: string;
  title: string;
  description: string;
  keywords: string;
}): Metadata {
  const canonical = `${BASE_URL}/sv/guide/${opts.slug}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    robots: 'index, follow',
    alternates: { canonical },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: canonical,
      type: 'article',
      locale: 'sv_SE',
      siteName: 'CVzume',
    },
  };
}

export function GuideJsonLd({
  slug,
  headline,
  description,
  faq,
}: {
  slug: string;
  headline: string;
  description: string;
  faq: Faq[];
}) {
  const canonical = `${BASE_URL}/sv/guide/${slug}`;
  const graph: object[] = [
    {
      '@type': 'Article',
      headline,
      description,
      inLanguage: 'sv-SE',
      mainEntityOfPage: canonical,
      author: { '@type': 'Organization', name: 'CVzume', url: BASE_URL },
      publisher: { '@type': 'Organization', name: 'CVzume', url: BASE_URL },
    },
  ];
  if (faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  const data = { '@context': 'https://schema.org', '@graph': graph };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function GuideShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <main style={s.main}>
      <a href="/sv" style={s.back}>
        ← Till startsidan
      </a>
      <h1 style={s.h1}>{title}</h1>
      <p style={s.lead}>{lead}</p>
      {children}
    </main>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 style={s.h2}>{children}</h2>;
}

export function Quote({ children }: { children: ReactNode }) {
  return <blockquote style={s.quote}>{children}</blockquote>;
}

export function Cta({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div style={s.ctaBox}>
      <h2 style={{ ...s.h2, marginTop: 0, color: '#fff' }}>{heading}</h2>
      <p style={{ margin: '0 0 20px' }}>{children}</p>
      <a href={REGISTER_URL} style={s.ctaBtn}>
        Kom igång gratis →
      </a>
    </div>
  );
}

export const GUIDES: { slug: string; label: string }[] = [
  { slug: 'cv-mall', label: 'CV-mall och exempel' },
  { slug: 'personligt-brev-exempel', label: 'Personligt brev – exempel' },
  { slug: 'cv-for-nyanlanda', label: 'CV för dig som är ny i Sverige' },
  { slug: 'vanliga-intervjufragor', label: 'Vanliga intervjufrågor' },
];

export function RelatedGuides({ current }: { current: string }) {
  const others = GUIDES.filter((g) => g.slug !== current);
  return (
    <>
      <H2>Fler guider</H2>
      <ul>
        {others.map((g) => (
          <li key={g.slug}>
            <a href={`/sv/guide/${g.slug}`} style={s.back}>
              {g.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

export function FaqSection({ items }: { items: Faq[] }) {
  return (
    <>
      <H2>Vanliga frågor</H2>
      {items.map((f) => (
        <div key={f.q} style={{ marginBottom: 20 }}>
          <h3 style={s.h3}>{f.q}</h3>
          <p style={{ margin: 0 }}>{f.a}</p>
        </div>
      ))}
    </>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 20px 80px',
    fontFamily: "'Segoe UI', system-ui, Arial, sans-serif",
    color: '#1E293B',
    lineHeight: 1.7,
  },
  back: { color: '#2563EB', textDecoration: 'none', fontSize: 14 },
  h1: { fontSize: 34, lineHeight: 1.2, color: '#0D1B2A', margin: '20px 0 16px' },
  lead: { fontSize: 18, color: '#334155' },
  h2: { fontSize: 24, color: '#0D1B2A', margin: '36px 0 12px' },
  h3: { fontSize: 18, color: '#0D1B2A', margin: '0 0 6px' },
  quote: {
    borderLeft: '4px solid #2563EB',
    background: '#F8FAFC',
    margin: '16px 0',
    padding: '8px 20px',
    borderRadius: 8,
    color: '#334155',
  },
  ctaBox: {
    background: '#0D1B2A',
    color: '#E2E8F0',
    borderRadius: 16,
    padding: '28px 28px 32px',
    margin: '40px 0',
  },
  ctaBtn: {
    display: 'inline-block',
    background: '#2563EB',
    color: 'white',
    textDecoration: 'none',
    fontWeight: 600,
    padding: '14px 24px',
    borderRadius: 10,
  },
};
