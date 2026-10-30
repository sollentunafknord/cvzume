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
      subtitle: 'The search opens on Indeed or LinkedIn. To see jobs right here, pick your country\'s source above.',
      queryPlaceholder: 'Job title, keywords or company...',
      locationPlaceholder: 'City or country (e.g. Stockholm)',
      tip: 'Indeed and LinkedIn offer no open API, so results open in a new tab.',
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
    sv: {
      title: 'Sök jobb på Indeed och LinkedIn',
      subtitle: 'Sökningen öppnas på Indeed eller LinkedIn. Vill du se jobben direkt här, välj Platsbanken ovan.',
      queryPlaceholder: 'Yrke, sökord eller företag …',
      locationPlaceholder: 'Ort (t.ex. Stockholm)',
      tip: 'Indeed och LinkedIn erbjuder inget öppet API, så resultaten öppnas i en ny flik. Platsbanken visar jobben direkt i CVzume.',
      indeedLabel: 'Sök på Indeed →',
      indeedSub: 'Miljontals jobb i Sverige och världen',
      indeedDesc: 'Indeed samlar annonser från tusentals företag och jobbsajter. Sök på titel, kompetens eller företag.',
      tags: ['Gratis', 'Globalt', 'Miljontals annonser'],
      linkedinUrl: (q: string, l: string) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Sverige')}`,
      linkedinLabel: 'Sök på LinkedIn →',
      linkedinSub: 'Professionellt nätverk och jobb',
      linkedinDesc: 'Hitta jobb och kontakta rekryterare direkt. Passar bra för tjänstemanna- och IT-roller.',
      linkedinTags: ['Professionellt', 'Nätverk', 'IT-fokus'],
    },
    tr: {
      title: 'Indeed ve LinkedIn\'de iş arayın',
      subtitle: 'Arama Indeed veya LinkedIn\'de açılır. İlanları burada görmek için yukarıdan ülkenizin kaynağını seçin.',
      queryPlaceholder: 'Pozisyon, anahtar kelime veya şirket …',
      locationPlaceholder: 'Şehir (ör. İstanbul)',
      tip: 'Indeed ve LinkedIn açık bir API sunmadığı için sonuçlar yeni sekmede açılır.',
      indeedLabel: 'Indeed\'de arayın →',
      indeedSub: 'Dünya genelinde milyonlarca ilan',
      indeedDesc: 'Indeed binlerce şirketin ve iş sitesinin ilanlarını bir araya getirir. Pozisyon, yetkinlik veya şirkete göre arayın.',
      tags: ['Ücretsiz', 'Küresel', 'Milyonlarca ilan'],
      linkedinUrl: (q: string, l: string) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(l || 'Türkiye')}`,
      linkedinLabel: 'LinkedIn\'de arayın →',
      linkedinSub: 'Profesyonel ağ ve iş ilanları',
      linkedinDesc: 'İş bulun ve işe alım uzmanlarıyla doğrudan bağlantı kurun. Profesyonel ve teknoloji rolleri için idealdir.',
      linkedinTags: ['Profesyonel', 'Ağ', 'Teknoloji'],
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

  const c = (CONFIG as Record<string, typeof CONFIG.en>)[locale] ?? CONFIG.en;
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
