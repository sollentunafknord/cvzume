'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import styles from './applications.module.css';
import { readCountryCookie } from '@/lib/market';

// Indeed har en sajt per land; välj efter besökarens land (cvz_country), annars språkets standard.
const INDEED_HOSTS: Record<string, string> = {
  SE: 'se', DE: 'de', AT: 'at', CH: 'ch', ES: 'es', MX: 'mx', AR: 'ar', CO: 'co', CL: 'cl', PE: 'pe', GB: 'uk', IE: 'ie', TR: 'tr',
};

export default function IndeedJobSearch() {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const country = readCountryCookie();
  const fallbackHost = locale === 'es' ? 'es' : locale === 'de' ? 'de' : 'se';
  const host = `https://${INDEED_HOSTS[country] ?? fallbackHost}.indeed.com`;

  const CONFIG = {
    en: {
      title: 'Job Search',
      subtitle: 'Find jobs via Indeed — one of the world\'s largest job platforms',
      queryPlaceholder: 'Job title, keywords or company...',
      locationPlaceholder: 'City or country (e.g. Stockholm)',
      tip: 'Enter a job title and location, then click search. Results open in a new tab.',
      indeedLabel: 'Search on Indeed →',
      indeedSub: 'Millions of jobs worldwide',
      indeedDesc: 'Indeed aggregates job listings from thousands of company career pages and job boards. Search by title, skills or company name.',
      tags: ['Free', 'Global', 'Millions of listings'],
      linkedinUrl: (q: string, l: string) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Sweden')}`,
      linkedinLabel: 'Search on LinkedIn →',
      linkedinSub: 'Professional network & jobs',
      linkedinDesc: 'Find jobs and connect directly with recruiters. Great for professional and tech roles.',
      linkedinTags: ['Professional', 'Networking', 'Tech-focused'],
    },
    es: {
      title: 'Búsqueda de empleo',
      subtitle: 'Encuentra trabajo a través de Indeed y LinkedIn',
      queryPlaceholder: 'Puesto, palabras clave o empresa...',
      locationPlaceholder: 'Ciudad o país (ej. Madrid)',
      tip: 'Escribe un término de búsqueda y una ubicación, luego haz clic en buscar. Los resultados se abren en una nueva pestaña.',
      indeedLabel: 'Buscar en Indeed →',
      indeedSub: 'Millones de empleos en España y el mundo',
      indeedDesc: 'Indeed reúne ofertas de empleo de miles de empresas y portales de trabajo. Busca por título, habilidades o nombre de empresa.',
      tags: ['Gratis', 'Global', 'Millones de ofertas'],
      linkedinUrl: (q: string, l: string) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'España')}`,
      linkedinLabel: 'Buscar en LinkedIn →',
      linkedinSub: 'Red profesional y empleo',
      linkedinDesc: 'Encuentra trabajo y conecta directamente con reclutadores. Ideal para perfiles profesionales y tecnológicos.',
      linkedinTags: ['Profesional', 'Red de contactos', 'Tecnología'],
    },
    de: {
      title: 'Jobsuche',
      subtitle: 'Finden Sie Stellen über Indeed und LinkedIn',
      queryPlaceholder: 'Jobtitel, Stichwörter oder Unternehmen …',
      locationPlaceholder: 'Stadt oder Land (z. B. Berlin)',
      tip: 'Geben Sie einen Suchbegriff und einen Ort ein und klicken Sie auf Suchen. Die Ergebnisse öffnen sich in einem neuen Tab.',
      indeedLabel: 'Auf Indeed suchen →',
      indeedSub: 'Millionen Stellen in Deutschland und weltweit',
      indeedDesc: 'Indeed bündelt Stellenanzeigen von Tausenden Unternehmen und Jobbörsen. Suchen Sie nach Jobtitel, Fähigkeiten oder Unternehmen.',
      tags: ['Kostenlos', 'Weltweit', 'Millionen Anzeigen'],
      linkedinUrl: (q: string, l: string) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Deutschland')}`,
      linkedinLabel: 'Auf LinkedIn suchen →',
      linkedinSub: 'Berufliches Netzwerk & Jobs',
      linkedinDesc: 'Finden Sie Stellen und vernetzen Sie sich direkt mit Recruitern. Ideal für Fach- und Tech-Rollen.',
      linkedinTags: ['Beruflich', 'Netzwerk', 'Tech-Fokus'],
    },
  };

  const c = locale === 'es' ? CONFIG.es : locale === 'de' ? CONFIG.de : CONFIG.en;
  const indeedUrl = (q: string, l: string) => `${host}/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`;

  function openIndeed(e: React.FormEvent) {
    e.preventDefault();
    window.open(indeedUrl(query.trim(), location.trim()), '_blank', 'noopener');
  }

  function openLinkedIn(e: React.MouseEvent) {
    e.preventDefault();
    window.open(c.linkedinUrl(query.trim(), location.trim()), '_blank', 'noopener');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{c.title}</h1>
        <p className={styles.subtitle}>{c.subtitle}</p>
      </div>

      <form className={styles.filters} onSubmit={openIndeed}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            placeholder={c.queryPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <input
            className={styles.searchInput}
            style={{ maxWidth: 220 }}
            placeholder={c.locationPlaceholder}
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>
      </form>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Indeed Card */}
        <div style={cardStyle}>
          <div style={logoRow}>
            <div style={{ ...logoBox, background: '#2164F3' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>indeed</span>
            </div>
            <div>
              <div style={cardTitle}>Indeed</div>
              <div style={cardSub}>{c.indeedSub}</div>
            </div>
          </div>
          <p style={cardDesc}>{c.indeedDesc}</p>
          <div style={tagRow}>
            {c.tags.map(t => <span key={t} style={tag}>{t}</span>)}
          </div>
          <button style={btnBlue} onClick={openIndeed}>
            {query.trim() ? `"${query}" — ${c.indeedLabel}` : c.indeedLabel}
          </button>
        </div>

        {/* LinkedIn Card */}
        <div style={cardStyle}>
          <div style={logoRow}>
            <div style={{ ...logoBox, background: '#0A66C2' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>in</span>
            </div>
            <div>
              <div style={cardTitle}>LinkedIn Jobs</div>
              <div style={cardSub}>{c.linkedinSub}</div>
            </div>
          </div>
          <p style={cardDesc}>{c.linkedinDesc}</p>
          <div style={tagRow}>
            {c.linkedinTags.map(t => <span key={t} style={tag}>{t}</span>)}
          </div>
          <button style={btnLinkedIn} onClick={openLinkedIn}>
            {query.trim() ? `"${query}" — ${c.linkedinLabel}` : c.linkedinLabel}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
        💡 {c.tip}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { flex: '1 1 300px', background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 };
const logoRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 };
const logoBox: React.CSSProperties = { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--navy)' };
const cardSub: React.CSSProperties = { fontSize: 12, color: 'var(--slate)' };
const cardDesc: React.CSSProperties = { fontSize: 13, color: 'var(--slate)', lineHeight: 1.6, margin: 0 };
const tagRow: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
const tag: React.CSSProperties = { background: '#F1F5F9', color: 'var(--slate)', fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20 };
const btnBlue: React.CSSProperties = { padding: '10px 16px', background: '#2164F3', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', marginTop: 'auto' };
const btnLinkedIn: React.CSSProperties = { padding: '10px 16px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', marginTop: 'auto' };
