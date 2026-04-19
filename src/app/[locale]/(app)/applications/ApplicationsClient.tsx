'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import styles from './applications.module.css';
import { Job, formatDeadline } from './types';
import JobCard from './JobCard';
import FavoritesTab from './FavoritesTab';
import TurkishJobSearch from './TurkishJobSearch';

interface Region { id: string; preferred_label: string; }
interface Municipality { id: string; preferred_label: string; broader_id: string; }
interface OccField { id: string; preferred_label: string; }

const PAGE_SIZE = 10;
const LS_FAV_KEY = 'cvita_job_favorites';

function lsLoadFavorites(): Job[] {
  try { return JSON.parse(localStorage.getItem(LS_FAV_KEY) || '[]'); } catch { return []; }
}
function lsSaveFavorites(favs: Job[]) {
  localStorage.setItem(LS_FAV_KEY, JSON.stringify(favs));
}

async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('cvita_token');
  const expiry = Number(localStorage.getItem('cvita_token_expiry') || 0);
  if (!token) return null;
  if (Date.now() < expiry - 60000) return token; // still valid

  // Try refresh
  const refreshToken = localStorage.getItem('cvita_refresh_token');
  if (!refreshToken) return token;
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return token;
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('cvita_token', data.access_token);
      localStorage.setItem('cvita_token_expiry', String(Date.now() + data.expires_in * 1000));
      if (data.refresh_token) localStorage.setItem('cvita_refresh_token', data.refresh_token);
      return data.access_token;
    }
  } catch { /* ignore */ }
  return token;
}

async function apiFavorites(token: string): Promise<Job[]> {
  try {
    const res = await fetch(`/api/favorites?token=${token}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.favorites || [];
  } catch { return []; }
}

export default function ApplicationsClient() {
  const t = useTranslations('jobs');
  const locale = useLocale();

  if (locale === 'tr') return <TurkishJobSearch />;

  const [tab, setTab] = useState<'search' | 'favorites'>('search');

  // Taxonomy
  const [regions, setRegions] = useState<Region[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [occFields, setOccFields] = useState<OccField[]>([]);
  const [taxLoaded, setTaxLoaded] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState('relevance');

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
    setFavorites(lsLoadFavorites()); // instant load from cache
    getValidToken().then(token => {
      if (token) apiFavorites(token).then(favs => {
        if (favs.length > 0) { setFavorites(favs); lsSaveFavorites(favs); }
      });
    });
    if (taxLoaded) return;
    Promise.all([
      fetch('/api/jobs/taxonomy?type=region').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=municipality').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=occupation-field').then(r => r.json()),
    ]).then(([reg, mun, field]) => {
      const regs: Region[] = (reg.data || [])
        .filter((r: Region) => r.preferred_label.toLowerCase().endsWith('län'))
        .sort((a: Region, b: Region) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      const regionIds = new Set(regs.map((r: Region) => r.id));
      const muns: Municipality[] = (mun.data || [])
        .filter((m: Municipality) => regionIds.has(m.broader_id))
        .sort((a: Municipality, b: Municipality) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      const fields: OccField[] = (field.data || []).sort((a: OccField, b: OccField) => a.preferred_label.localeCompare(b.preferred_label, 'sv'));
      setRegions(regs);
      setMunicipalities(muns);
      setOccFields(fields);
      setTaxLoaded(true);
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
    if (sortBy && sortBy !== 'relevance') params.set('sort', sortBy);
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
  }, [query, selRegion, selMunicipalities, selFields, sortBy]);

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
    const exists = favorites.some(f => f.id === job.id);
    const next = exists ? favorites.filter(f => f.id !== job.id) : [job, ...favorites];
    setFavorites(next);
    lsSaveFavorites(next); // always persist locally

    getValidToken().then(token => {
      if (!token) return;
      if (exists) {
        fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, jobId: job.id }),
        }).catch(() => {});
      } else {
        fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, job }),
        }).catch(() => {});
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, type: 'favorite', title: job.headline, subtitle: job.employer?.name || null }),
        }).catch(() => {});
      }
    });
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
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="relevance">Sortera: Relevans</option>
                <option value="pubdate-desc">Senast publicerade</option>
                <option value="applydate-asc">Sista ansökningsdag (närmast)</option>
                <option value="applydate-desc">Sista ansökningsdag (längst bort)</option>
              </select>
              <button type="submit" className={styles.searchBtn} disabled={loading}>
                {loading ? t('loading') : t('search_btn')}
              </button>
            </div>
          </form>

          {searched && results.length > 0 && (
            <div className={styles.resultsHeader}>
              <span className={styles.resultCount}>
                {t('results_count', { count: total.toLocaleString('sv-SE') })}
              </span>
            </div>
          )}

          {searched && results.length > 0 && (
            <div className={styles.searchHint}>
              <span className={styles.searchHintIcon}>💡</span>
              <span>Bläddra bland jobben och klicka på <strong>★</strong> bredvid en annons för att spara den till dina Favoriter — där förbereder du ditt CV och personliga brev.</span>
            </div>
          )}

          <div className={styles.jobList}>
            {results.map(job => (
              <JobCard
                key={job.id}
                job={job}
                favorited={favorites.some(f => f.id === job.id)}
                onToggleFavorite={toggleFavorite}
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
        <FavoritesTab favorites={favorites} onToggleFavorite={toggleFavorite} t={t} />
      )}
    </div>
  );
}
