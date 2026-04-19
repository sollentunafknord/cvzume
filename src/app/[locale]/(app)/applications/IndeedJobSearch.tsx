'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import styles from './applications.module.css';

export default function IndeedJobSearch() {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const isSpanish = locale === 'es';

  const CONFIG = {
    en: {
      title: 'Job Search',
      subtitle: 'Find jobs via Indeed — one of the world\'s largest job platforms',
      queryPlaceholder: 'Job title, keywords or company...',
      locationPlaceholder: 'City or country (e.g. Stockholm)',
      tip: 'Enter a job title and location, then click search. Results open in a new tab.',
      indeedUrl: (q: string, l: string) =>
        `https://se.indeed.com/jobs?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`,
      indeedLabel: 'Search on Indeed →',
      indeedBase: 'https://se.indeed.com',
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
      indeedUrl: (q: string, l: string) =>
        `https://es.indeed.com/trabajo?q=${encodeURIComponent(q)}&l=${encodeURIComponent(l)}`,
      indeedLabel: 'Buscar en Indeed →',
      indeedBase: 'https://es.indeed.com',
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
  };

  const c = isSpanish ? CONFIG.es : CONFIG.en;

  function openIndeed(e: React.FormEvent) {
    e.preventDefault();
    window.open(c.indeedUrl(query.trim(), location.trim()), '_blank', 'noopener');
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
