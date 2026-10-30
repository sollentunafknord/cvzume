'use client';

// InfoJobs (İspanya) ilan araması. Yapı GermanJobSearch ile aynı: "Analiz et" tam ilan metnini
// çeker ve dashboard'daki "Ny ansökan" penceresini doldurulmuş açar (cvita_prefill_job).
// API anahtarı yoksa (not_configured) aramayı infojobs.net'te açan link gösterilir.
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';

type Hit = { id: string; title: string; company: string; location: string; published: string; url: string };
type Province = { id: string; name: string };

export default function SpainJobSearch() {
  const t = useTranslations('ij');
  const locale = useLocale();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [province, setProvince] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);
  const [analyzing, setAnalyzing] = useState('');

  useEffect(() => {
    fetch('/api/jobs/infojobs?provinces=1')
      .then(r => r.json())
      .then(d => {
        if (d.error === 'not_configured') setNotConfigured(true);
        setProvinces(d.provinces || []);
      })
      .catch(() => setProvinces([]));
  }, []);

  async function search(p = 1) {
    setLoading(true);
    setError('');
    setFallbackUrl('');
    try {
      const qs = new URLSearchParams({ q, province, page: String(p) });
      const res = await fetch(`/api/jobs/infojobs?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.fallbackUrl) setFallbackUrl(data.fallbackUrl);
        throw new Error();
      }
      setHits(p === 1 ? data.hits : [...hits, ...data.hits]);
      setTotal(data.total);
      setTotalPages(data.totalPages);
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
      const res = await fetch(`/api/jobs/infojobs?detail=${encodeURIComponent(hit.id)}`);
      const ad = await res.json();
      if (!res.ok || !ad.text) throw new Error();
      const head = [ad.title, [ad.company, ad.location].filter(Boolean).join(' · ')].filter(Boolean).join('\n');
      localStorage.setItem('cvita_prefill_job', JSON.stringify({
        role: [ad.title, ad.company].filter(Boolean).join(' — '),
        description: `${head}\n\n${ad.text}`.slice(0, 6000),
      }));
      router.push(`/${locale}/dashboard`);
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
          <input className={styles.searchInput} placeholder={t('what')} value={q} onChange={e => setQ(e.target.value)} />
          <select className={styles.searchInput} style={{ maxWidth: 220 }} value={province} onChange={e => setProvince(e.target.value)} aria-label={t('province')} disabled={notConfigured}>
            <option value="">{t('all_spain')}</option>
            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              {h.url && <a href={h.url} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>{t('open')}</a>}
            </div>
          </div>
        ))}
      </div>

      {hits.length > 0 && page < totalPages && (
        <button type="button" className={styles.searchBtn} style={{ marginTop: 16 }} onClick={() => search(page + 1)} disabled={loading}>
          {loading ? '…' : t('more')}
        </button>
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>{t('source_note')}</p>
    </div>
  );
}
