'use client';

// Bundesagentur für Arbeit (Almanya) ilan araması. "Analiz et" ilanın tam metnini çeker
// ve "Ny ansökan" akışını o ilanla açar (cvita_prefill_job).
import { applyPath } from '@/lib/market';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';

type Hit = { id: string; title: string; company: string; location: string; published: string; url: string; externalUrl?: string };

const RADII = [0, 10, 25, 50, 100];

export default function GermanJobSearch() {
  const t = useTranslations('ba');
  const locale = useLocale();
  const router = useRouter();
  const [was, setWas] = useState('');
  const [wo, setWo] = useState('');
  const [umkreis, setUmkreis] = useState(25);
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState('');
  // BA kapalıysa: aynı aramayı arbeitsagentur.de'de açan link
  const [fallbackUrl, setFallbackUrl] = useState('');

  async function search(p = 1) {
    setLoading(true);
    setError('');
    setFallbackUrl('');
    try {
      const qs = new URLSearchParams({ was, wo, umkreis: String(umkreis), page: String(p) });
      const res = await fetch(`/api/jobs/arbeitsagentur?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.fallbackUrl) setFallbackUrl(data.fallbackUrl);
        throw new Error();
      }
      setHits(p === 1 ? data.hits : [...hits, ...data.hits]);
      setTotal(data.total);
      setPage(p);
      setSearched(true);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  async function analyze(hit: Hit) {
    setAnalyzing(hit.id);
    setError('');
    try {
      const qs = new URLSearchParams({ detail: hit.id });
      if (hit.externalUrl) qs.set('ext', hit.externalUrl);
      const res = await fetch(`/api/jobs/arbeitsagentur?${qs}`);
      const ad = await res.json();
      if (!res.ok || !ad.text) throw new Error();
      const head = [ad.title, [ad.company, ad.location].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
      localStorage.setItem('cvita_prefill_job', JSON.stringify({
        role: [ad.title, ad.company].filter(Boolean).join(' — '),
        description: `${head}\n\n${ad.text}`.slice(0, 6000),
      }));
      router.push(applyPath(locale));
    } catch {
      setError(t('error_detail'));
      setAnalyzing('');
    }
  }

  const dateFmt = (d: string) => {
    try { return new Date(d).toLocaleDateString(locale === 'sv' ? 'sv-SE' : locale, { day: 'numeric', month: 'short' }); } catch { return d; }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <form className={styles.filters} onSubmit={e => { e.preventDefault(); search(1); }}>
        <div className={styles.searchRow}>
          <input className={styles.searchInput} placeholder={t('what')} value={was} onChange={e => setWas(e.target.value)} />
          <input className={styles.searchInput} style={{ maxWidth: 200 }} placeholder={t('where')} value={wo} onChange={e => setWo(e.target.value)} />
          <select className={styles.searchInput} style={{ maxWidth: 120 }} value={umkreis} onChange={e => setUmkreis(Number(e.target.value))} aria-label={t('radius')} disabled={!wo.trim()}>
            {RADII.map(r => <option key={r} value={r}>{r === 0 ? t('radius_exact') : `+ ${r} km`}</option>)}
          </select>
          <button type="submit" className={styles.searchBtn} disabled={loading}>{loading && page === 1 ? '…' : t('search')}</button>
        </div>
      </form>

      {error && !fallbackUrl && <div style={{ color: '#B91C1C', fontSize: 14, margin: '12px 0' }}>{error}</div>}
      {fallbackUrl && (
        <div style={{ margin: '12px 0', padding: '14px 18px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 14, color: '#92400E' }}>
          {t('fallback')}{' '}
          <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#92400E', fontWeight: 600 }}>{t('fallback_link')}</a>
        </div>
      )}
      {searched && <div className={styles.resultCount}>{t('results', { count: total.toLocaleString(locale === 'sv' ? 'sv-SE' : locale) })}</div>}
      {searched && hits.length === 0 && !loading && <div className={styles.subtitle}>{t('none')}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {hits.map(h => (
          <div key={h.id} className={styles.jobCard}>
            <div className={styles.jobCardHeader}>
              <div className={styles.jobInfo}>
                <h3 className={styles.jobTitle}>{h.title}</h3>
                <div className={styles.jobMeta}>
                  {h.company && <span className={styles.employer}>{h.company}</span>}
                  {h.location && <span className={styles.location}>📍 {h.location}</span>}
                  {h.published && <span className={styles.deadline}>{t('published')}: {dateFmt(h.published)}</span>}
                </div>
              </div>
            </div>
            <div className={styles.jobActions}>
              <button type="button" className={styles.searchBtn} onClick={() => analyze(h)} disabled={!!analyzing}>
                {analyzing === h.id ? t('analyzing') : t('analyze')}
              </button>
              <a href={h.url} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>{t('open')}</a>
            </div>
          </div>
        ))}
      </div>

      {hits.length > 0 && hits.length < total && (
        <button type="button" className={styles.searchBtn} style={{ marginTop: 16 }} onClick={() => search(page + 1)} disabled={loading}>
          {loading ? '…' : t('more')}
        </button>
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>{t('source_note')}</p>
    </div>
  );
}
