'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';

interface Region { id: string; preferred_label: string; }
interface Municipality { id: string; preferred_label: string; broader_id: string; }
interface OccField { id: string; preferred_label: string; }

interface Job {
  id: string;
  headline: string;
  employer?: { name?: string };
  workplace_address?: { municipality?: string; region?: string };
  description?: { text?: string };
  application_deadline?: string;
  webpage_url?: string;
}

const FAVORITES_KEY = 'cvita_job_favorites';
const PAGE_SIZE = 10;

function loadFavorites(): Job[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
  catch { return []; }
}
function saveFavorites(favs: Job[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}
function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  try { return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return null; }
}

interface Props {
  onAnalyze?: (role: string, description: string) => void;
}

export default function ApplicationsClient({ onAnalyze }: Props = {}) {
  const t = useTranslations('jobs');
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<'search' | 'favorites'>('search');

  // Taxonomy
  const [regions, setRegions] = useState<Region[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [occFields, setOccFields] = useState<OccField[]>([]);
  const [taxLoaded, setTaxLoaded] = useState(false);

  // Filter panel state
  const [ortOpen, setOrtOpen] = useState(false);
  const [yrkeOpen, setYrkeOpen] = useState(false);
  const [hoverRegion, setHoverRegion] = useState('');
  const [selMunicipalities, setSelMunicipalities] = useState<string[]>([]);
  const [selRegion, setSelRegion] = useState('');
  const [selFields, setSelFields] = useState<string[]>([]);
  const ortRef = useRef<HTMLDivElement>(null);
  const yrkeRef = useRef<HTMLDivElement>(null);

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [favorites, setFavorites] = useState<Job[]>([]);

  // Close panels on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ortRef.current && !ortRef.current.contains(e.target as Node)) setOrtOpen(false);
      if (yrkeRef.current && !yrkeRef.current.contains(e.target as Node)) setYrkeOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load taxonomy once
  useEffect(() => {
    setFavorites(loadFavorites());
    if (taxLoaded) return;
    Promise.all([
      fetch('/api/jobs/taxonomy?type=region').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=municipality').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=occupation-field').then(r => r.json()),
    ]).then(([reg, mun, field]) => {
      const regs: Region[] = (reg.data || []).sort((a: Region, b: Region) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      const muns: Municipality[] = (mun.data || []).sort((a: Municipality, b: Municipality) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      const fields: OccField[] = (field.data || []).sort((a: OccField, b: OccField) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      setRegions(regs);
      setMunicipalities(muns);
      setOccFields(fields);
      setTaxLoaded(true);
      // default hover to first region
      if (regs.length > 0) setHoverRegion(regs[0].id);
    }).catch(console.error);
  }, [taxLoaded]);

  const kommunerInRegion = hoverRegion
    ? municipalities.filter(m => m.broader_id === hoverRegion)
    : [];

  const search = useCallback(async (newOffset = 0) => {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) });
    if (query.trim()) params.set('q', query.trim());
    if (selMunicipalities.length > 0) {
      selMunicipalities.forEach(id => params.append('municipality', id));
    } else if (selRegion) {
      params.set('region', selRegion);
    }
    if (selFields.length > 0) {
      selFields.forEach(id => params.append('occupation-field', id));
    }
    try {
      const res = await fetch(`/api/jobs/search?${params}`);
      const data = await res.json();
      const hits: Job[] = data.hits || [];
      setResults(newOffset === 0 ? hits : prev => [...prev, ...hits]);
      setTotal(data.total?.value || 0);
      setOffset(newOffset);
    } finally {
      setLoading(false);
    }
  }, [query, selRegion, selMunicipalities, selFields]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(0);
  }

  function toggleMunicipality(id: string) {
    setSelMunicipalities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function toggleField(id: string) {
    setSelFields(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function selectRegion(id: string) {
    setSelRegion(id);
    setSelMunicipalities([]);
    setHoverRegion(id);
  }

  function clearOrt() { setSelRegion(''); setSelMunicipalities([]); }
  function clearYrke() { setSelFields([]); }

  function toggleFavorite(job: Job) {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === job.id);
      const next = exists ? prev.filter(f => f.id !== job.id) : [...prev, job];
      saveFavorites(next);
      return next;
    });
  }

  function analyzeJob(job: Job) {
    const role = job.headline;
    const description = job.description?.text || '';
    if (onAnalyze) {
      onAnalyze(role, description);
    } else {
      localStorage.setItem('cvita_prefill_job', JSON.stringify({ role, description }));
      router.push(`/${locale}/dashboard`);
    }
  }

  const ortLabel = selMunicipalities.length > 0
    ? `${selMunicipalities.length} kommuner`
    : selRegion
      ? regions.find(r => r.id === selRegion)?.preferred_label || 'Ort'
      : 'Ort';

  const yrkeLabel = selFields.length > 0
    ? selFields.length === 1
      ? occFields.find(f => f.id === selFields[0])?.preferred_label || 'Yrke'
      : `${selFields.length} yrkesområden`
    : 'Yrke';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'search' ? styles.tabActive : ''}`} onClick={() => setTab('search')}>
          🔍 {t('tab_search')}
        </button>
        <button className={`${styles.tab} ${tab === 'favorites' ? styles.tabActive : ''}`} onClick={() => setTab('favorites')}>
          ★ {t('tab_favorites')}
          {favorites.length > 0 && <span className={styles.badge}>{favorites.length}</span>}
        </button>
      </div>

      {tab === 'search' && (
        <>
          <form className={styles.filters} onSubmit={handleSearch}>
            <div className={styles.filterBtnRow}>
              {/* ORT PANEL */}
              <div className={styles.filterPanelWrap} ref={ortRef}>
                <button
                  type="button"
                  className={`${styles.filterPillBtn} ${(selRegion || selMunicipalities.length > 0) ? styles.filterPillActive : ''}`}
                  onClick={() => { setOrtOpen(o => !o); setYrkeOpen(false); }}
                >
                  {ortLabel} {ortOpen ? '▲' : '▼'}
                </button>
                {ortOpen && (
                  <div className={styles.filterPanel}>
                    <div className={styles.filterPanelHeader}>
                      <span className={styles.filterPanelTitle}>Välj ort</span>
                      {(selRegion || selMunicipalities.length > 0) && (
                        <button type="button" className={styles.clearBtn} onClick={clearOrt}>Rensa</button>
                      )}
                    </div>
                    <div className={styles.filterPanelBody}>
                      <div className={styles.regionList}>
                        {regions.map(r => (
                          <div
                            key={r.id}
                            className={`${styles.regionItem} ${hoverRegion === r.id ? styles.regionItemActive : ''} ${selRegion === r.id ? styles.regionItemSelected : ''}`}
                            onClick={() => selectRegion(r.id)}
                            onMouseEnter={() => setHoverRegion(r.id)}
                          >
                            {r.preferred_label}
                            <span className={styles.regionArrow}>›</span>
                          </div>
                        ))}
                      </div>
                      <div className={styles.kommunList}>
                        <label className={styles.kommunItem}>
                          <input
                            type="checkbox"
                            checked={selRegion === hoverRegion && selMunicipalities.length === 0}
                            onChange={() => {
                              if (selRegion === hoverRegion && selMunicipalities.length === 0) {
                                setSelRegion('');
                              } else {
                                selectRegion(hoverRegion);
                              }
                            }}
                          />
                          <span>Alla kommuner i länet</span>
                        </label>
                        {kommunerInRegion.map(m => (
                          <label key={m.id} className={styles.kommunItem}>
                            <input
                              type="checkbox"
                              checked={selMunicipalities.includes(m.id)}
                              onChange={() => {
                                setSelRegion('');
                                toggleMunicipality(m.id);
                              }}
                            />
                            <span>{m.preferred_label}</span>
                          </label>
                        ))}
                        {kommunerInRegion.length === 0 && hoverRegion && (
                          <div className={styles.kommunEmpty}>Laddar kommuner...</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* YRKE PANEL */}
              <div className={styles.filterPanelWrap} ref={yrkeRef}>
                <button
                  type="button"
                  className={`${styles.filterPillBtn} ${selFields.length > 0 ? styles.filterPillActive : ''}`}
                  onClick={() => { setYrkeOpen(o => !o); setOrtOpen(false); }}
                >
                  {yrkeLabel} {yrkeOpen ? '▲' : '▼'}
                </button>
                {yrkeOpen && (
                  <div className={styles.filterPanel} style={{ minWidth: 280 }}>
                    <div className={styles.filterPanelHeader}>
                      <span className={styles.filterPanelTitle}>Välj yrkesområde</span>
                      {selFields.length > 0 && (
                        <button type="button" className={styles.clearBtn} onClick={clearYrke}>Rensa</button>
                      )}
                    </div>
                    <div className={styles.yrkeList}>
                      {occFields.map(f => (
                        <label key={f.id} className={styles.kommunItem}>
                          <input
                            type="checkbox"
                            checked={selFields.includes(f.id)}
                            onChange={() => toggleField(f.id)}
                          />
                          <span>{f.preferred_label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.searchRow}>
              <input
                className={styles.searchInput}
                placeholder={t('filter_query')}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button type="submit" className={styles.searchBtn} disabled={loading}>
                {loading ? t('loading') : t('search_btn')}
              </button>
            </div>
          </form>

          {searched && (
            <div className={styles.resultsHeader}>
              <span className={styles.resultCount}>
                {t('results_count', { count: total.toLocaleString('sv-SE') })}
              </span>
            </div>
          )}

          <div className={styles.jobList}>
            {results.map(job => (
              <JobCard
                key={job.id}
                job={job}
                favorited={favorites.some(f => f.id === job.id)}
                onToggleFavorite={toggleFavorite}
                onAnalyze={analyzeJob}
                t={t}
              />
            ))}
            {searched && !loading && results.length === 0 && (
              <div className={styles.empty}>{t('no_results')}</div>
            )}
          </div>

          {results.length > 0 && results.length < total && (
            <div className={styles.loadMoreWrap}>
              <button
                className={styles.loadMoreBtn}
                onClick={() => search(offset + PAGE_SIZE)}
                disabled={loading}
              >
                {loading ? t('loading') : t('load_more')}
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'favorites' && (
        <div className={styles.jobList}>
          {favorites.length === 0 && <div className={styles.empty}>{t('no_favorites')}</div>}
          {favorites.map(job => (
            <JobCard
              key={job.id}
              job={job}
              favorited
              onToggleFavorite={toggleFavorite}
              onAnalyze={analyzeJob}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, favorited, onToggleFavorite, onAnalyze, t }: {
  job: Job; favorited: boolean;
  onToggleFavorite: (job: Job) => void;
  onAnalyze: (job: Job) => void;
  t: (key: string) => string;
}) {
  const deadline = formatDeadline(job.application_deadline);
  return (
    <div className={styles.jobCard}>
      <div className={styles.jobCardHeader}>
        <div className={styles.jobInfo}>
          <h3 className={styles.jobTitle}>{job.headline}</h3>
          <div className={styles.jobMeta}>
            {job.employer?.name && <span className={styles.employer}>{job.employer.name}</span>}
            {(job.workplace_address?.municipality || job.workplace_address?.region) && (
              <span className={styles.location}>📍 {job.workplace_address.municipality || job.workplace_address.region}</span>
            )}
            {deadline && <span className={styles.deadline}>⏰ {t('deadline')}: {deadline}</span>}
          </div>
        </div>
        <button
          className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
          onClick={() => onToggleFavorite(job)}
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>
      {job.description?.text && (
        <p className={styles.jobDesc}>{job.description.text.replace(/<[^>]+>/g, '').slice(0, 200)}…</p>
      )}
      <div className={styles.jobActions}>
        <button className={styles.analyzeBtn} onClick={() => onAnalyze(job)}>✨ {t('analyze_btn')}</button>
        {job.webpage_url && (
          <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>
            {t('apply_btn')}
          </a>
        )}
      </div>
    </div>
  );
}
