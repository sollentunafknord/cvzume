'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './applications.module.css';

interface TaxItem {
  id: string;
  preferred_label: string;
}

interface Job {
  id: string;
  headline: string;
  employer?: { name?: string };
  workplace_address?: { municipality?: string; region?: string };
  description?: { text?: string };
  application_deadline?: string;
  webpage_url?: string;
  employment_type?: { label?: string };
}

const FAVORITES_KEY = 'cvita_job_favorites';
const PAGE_SIZE = 10;

function loadFavorites(): Job[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch { return []; }
}

function saveFavorites(favs: Job[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function formatDeadline(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('sv-SE', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return null; }
}

interface Props {
  onAnalyze?: (role: string, description: string) => void;
  isModal?: boolean;
}

export default function ApplicationsClient({ onAnalyze, isModal }: Props = {}) {
  const t = useTranslations('jobs');
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<'search' | 'favorites'>('search');

  // Taxonomy data
  const [regions, setRegions] = useState<TaxItem[]>([]);
  const [municipalities, setMunicipalities] = useState<TaxItem[]>([]);
  const [occFields, setOccFields] = useState<TaxItem[]>([]);
  const [occGroups, setOccGroups] = useState<TaxItem[]>([]);

  // Filters
  const [selRegion, setSelRegion] = useState('');
  const [selMunicipality, setSelMunicipality] = useState('');
  const [selField, setSelField] = useState('');
  const [selGroup, setSelGroup] = useState('');
  const [query, setQuery] = useState('');

  // Results
  const [results, setResults] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState<Job[]>([]);

  // Load taxonomy on mount
  useEffect(() => {
    setFavorites(loadFavorites());

    async function loadTaxonomy() {
      const [regRes, munRes, fieldRes, groupRes] = await Promise.all([
        fetch('/api/jobs/taxonomy?type=region&limit=30'),
        fetch('/api/jobs/taxonomy?type=municipality&limit=400'),
        fetch('/api/jobs/taxonomy?type=occupation-field&limit=50'),
        fetch('/api/jobs/taxonomy?type=occupation-group&limit=500'),
      ]);
      const [regData, munData, fieldData, groupData] = await Promise.all([
        regRes.json(), munRes.json(), fieldRes.json(), groupRes.json(),
      ]);
      setRegions(regData.data || []);
      setMunicipalities(munData.data || []);
      setOccFields(fieldData.data || []);
      setOccGroups(groupData.data || []);
    }

    loadTaxonomy().catch(console.error);
  }, []);

  const filteredMunicipalities = municipalities;
  const filteredGroups = occGroups;

  const search = useCallback(async (newOffset = 0) => {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) });
    if (query.trim()) params.set('q', query.trim());
    if (selMunicipality) params.set('municipality', selMunicipality);
    else if (selRegion) params.set('region', selRegion);
    if (selGroup) params.set('occupation-group', selGroup);
    else if (selField) params.set('occupation-field', selField);

    try {
      const res = await fetch(`/api/jobs/search?${params}`);
      const data = await res.json();
      const hits: Job[] = data.hits || [];
      if (newOffset === 0) {
        setResults(hits);
      } else {
        setResults(prev => [...prev, ...hits]);
      }
      setTotal(data.total?.value || 0);
      setOffset(newOffset);
    } finally {
      setLoading(false);
    }
  }, [query, selRegion, selMunicipality, selField, selGroup]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(0);
  }

  function toggleFavorite(job: Job) {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === job.id);
      const next = exists ? prev.filter(f => f.id !== job.id) : [...prev, job];
      saveFavorites(next);
      return next;
    });
  }

  function isFavorite(id: string) {
    return favorites.some(f => f.id === id);
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'search' ? styles.tabActive : ''}`}
          onClick={() => setTab('search')}
        >
          🔍 {t('tab_search')}
        </button>
        <button
          className={`${styles.tab} ${tab === 'favorites' ? styles.tabActive : ''}`}
          onClick={() => setTab('favorites')}
        >
          ★ {t('tab_favorites')}
          {favorites.length > 0 && <span className={styles.badge}>{favorites.length}</span>}
        </button>
      </div>

      {tab === 'search' && (
        <>
          <form className={styles.filters} onSubmit={handleSearch}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('filter_lan')}</label>
                <select
                  className={styles.select}
                  value={selRegion}
                  onChange={e => { setSelRegion(e.target.value); setSelMunicipality(''); }}
                >
                  <option value="">{t('anywhere')}</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.preferred_label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('filter_kommun')}</label>
                <select
                  className={styles.select}
                  value={selMunicipality}
                  onChange={e => setSelMunicipality(e.target.value)}
                  disabled={!selRegion}
                >
                  <option value="">{t('all_kommuner')}</option>
                  {filteredMunicipalities.map(m => (
                    <option key={m.id} value={m.id}>{m.preferred_label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('filter_field')}</label>
                <select
                  className={styles.select}
                  value={selField}
                  onChange={e => { setSelField(e.target.value); setSelGroup(''); }}
                >
                  <option value="">{t('all_fields')}</option>
                  {occFields.map(f => (
                    <option key={f.id} value={f.id}>{f.preferred_label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t('filter_group')}</label>
                <select
                  className={styles.select}
                  value={selGroup}
                  onChange={e => setSelGroup(e.target.value)}
                  disabled={!selField}
                >
                  <option value="">{t('all_groups')}</option>
                  {filteredGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.preferred_label}</option>
                  ))}
                </select>
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
                favorited={isFavorite(job.id)}
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
          {favorites.length === 0 && (
            <div className={styles.empty}>{t('no_favorites')}</div>
          )}
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

function JobCard({
  job,
  favorited,
  onToggleFavorite,
  onAnalyze,
  t,
}: {
  job: Job;
  favorited: boolean;
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
            {job.employer?.name && (
              <span className={styles.employer}>{job.employer.name}</span>
            )}
            {(job.workplace_address?.municipality || job.workplace_address?.region) && (
              <span className={styles.location}>
                📍 {job.workplace_address.municipality || job.workplace_address.region}
              </span>
            )}
            {deadline && (
              <span className={styles.deadline}>⏰ {t('deadline')}: {deadline}</span>
            )}
          </div>
        </div>
        <button
          className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
          onClick={() => onToggleFavorite(job)}
          title={favorited ? t('favorite_remove') : t('favorite_add')}
        >
          {favorited ? '★' : '☆'}
        </button>
      </div>

      {job.description?.text && (
        <p className={styles.jobDesc}>
          {job.description.text.replace(/<[^>]+>/g, '').slice(0, 200)}…
        </p>
      )}

      <div className={styles.jobActions}>
        <button className={styles.analyzeBtn} onClick={() => onAnalyze(job)}>
          ✨ {t('analyze_btn')}
        </button>
        {job.webpage_url && (
          <a
            href={job.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.applyLink}
          >
            {t('apply_btn')}
          </a>
        )}
      </div>
    </div>
  );
}
