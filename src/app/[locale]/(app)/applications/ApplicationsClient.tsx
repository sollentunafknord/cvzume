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

export default function ApplicationsClient() {
  const t = useTranslations('jobs');

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

function JobCard({ job, favorited, onToggleFavorite, t }: {
  job: Job; favorited: boolean;
  onToggleFavorite: (job: Job) => void;
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
        {job.webpage_url && (
          <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className={styles.applyLink}>
            {t('apply_btn')}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── FAVORITES TAB ── */
function FavoritesTab({ favorites, onToggleFavorite, t }: {
  favorites: Job[];
  onToggleFavorite: (job: Job) => void;
  t: (key: string) => string;
}) {
  const locale = useLocale();
  const router = useRouter();

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    matchScore: number; cvSummary: string; coverLetter: string;
    keyRequirements: string[]; tips: string[];
  } | null>(null);
  const [step, setStep] = useState<'list' | 'nocv' | 'analyze' | 'result'>('list');

  function checkCVAndStart(job: Job) {
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    const cvExists = !!(profile.firstName || profile.summary || profile.experiences?.length > 0);
    setSelectedJob(job);
    setAnalysisResult(null);
    setStep(cvExists ? 'analyze' : 'nocv');
  }

  async function runAnalysis() {
    if (!selectedJob) return;
    setAnalyzing(true);
    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobAd: selectedJob.description?.text || selectedJob.headline,
          userProfile: profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fel');
      localStorage.setItem('cvita_last_result', JSON.stringify({ role: selectedJob.headline, ...data }));
      setAnalysisResult(data);
      setStep('result');
    } catch {
      alert('Något gick fel vid analysen. Försök igen.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (favorites.length === 0) {
    return (
      <div className={styles.favEmpty}>
        <div className={styles.favEmptyIcon}>★</div>
        <div className={styles.favEmptyTitle}>Inga sparade jobb än</div>
        <div className={styles.favEmptySub}>Sök jobb och klicka på ★ för att spara dem här.</div>
      </div>
    );
  }

  if (step === 'nocv') {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepIcon}>📄</div>
        <div className={styles.stepTitle}>Du behöver ett CV först</div>
        <p className={styles.stepDesc}>
          För att anpassa ditt CV till <strong>{selectedJob?.headline}</strong> behöver du fylla i din profil. Det tar bara några minuter.
        </p>
        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Tillbaka</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/profile`)}>Skapa mitt CV →</button>
        </div>
      </div>
    );
  }

  if (step === 'analyze') {
    return (
      <div className={styles.stepCard}>
        <div className={styles.stepIcon}>🎯</div>
        <div className={styles.stepTitle}>Anpassa ditt CV till jobbet</div>
        <p className={styles.stepDesc}>
          AI:n analyserar annonsen för <strong>{selectedJob?.headline}</strong> och ger konkreta förslag på hur du förbättrar ditt CV för just det här jobbet — t.ex. vilka nyckelord du bör använda.
        </p>
        <div className={styles.jobPreview}>
          <div className={styles.jobPreviewTitle}>{selectedJob?.headline}</div>
          {selectedJob?.employer?.name && <div className={styles.jobPreviewEmployer}>{selectedJob.employer.name}</div>}
        </div>
        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Tillbaka</button>
          <button className={styles.stepBtnPrimary} onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? '⏳ Analyserar...' : '✨ Analysera & anpassa CV →'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'result' && analysisResult) {
    return (
      <div className={styles.resultCard}>
        <div className={styles.resultCardHeader}>
          <div>
            <div className={styles.resultCardTitle}>{selectedJob?.headline}</div>
            {selectedJob?.employer?.name && <div className={styles.resultCardSub}>{selectedJob.employer.name}</div>}
          </div>
          <span className={styles.matchBadge}>{analysisResult.matchScore}% match</span>
        </div>

        <div className={styles.resultSection}>
          <div className={styles.resultSectionTitle}>🎯 Nyckelord från annonsen</div>
          <div className={styles.tagRow}>
            {analysisResult.keyRequirements?.map((r, i) => <span key={i} className={styles.tag}>{r}</span>)}
          </div>
        </div>

        <div className={styles.resultSection}>
          <div className={styles.resultSectionTitle}>📄 CV-förslag</div>
          <div className={styles.resultText}>{analysisResult.cvSummary}</div>
        </div>

        {analysisResult.tips?.length > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.resultSectionTitle}>💡 Tips för ditt CV</div>
            {analysisResult.tips.map((tip, i) => <div key={i} className={styles.tipRow}>→ {tip}</div>)}
          </div>
        )}

        <div className={styles.stepActions}>
          <button className={styles.stepBtnSecondary} onClick={() => setStep('list')}>← Andra jobb</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/profile`)}>Uppdatera CV →</button>
          <button className={styles.stepBtnPrimary} onClick={() => router.push(`/${locale}/letter`)}>Skriv personligt brev →</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.favHint}>
        <span>⭐</span>
        <span>Välj ett jobb för att anpassa ditt CV och skriva ett personligt brev.</span>
      </div>
      <div className={styles.favList}>
        {favorites.map(job => (
          <div key={job.id} className={styles.favItem}>
            <div className={styles.favItemInfo}>
              <div className={styles.favItemTitle}>{job.headline}</div>
              <div className={styles.favItemMeta}>
                {job.employer?.name && <span>{job.employer.name}</span>}
                {job.workplace_address?.municipality && <span>📍 {job.workplace_address.municipality}</span>}
                {job.application_deadline && <span>⏰ {formatDeadline(job.application_deadline)}</span>}
              </div>
            </div>
            <div className={styles.favItemActions}>
              <button className={styles.stepBtnSecondary} onClick={() => onToggleFavorite(job)}>Ta bort</button>
              {job.webpage_url && (
                <a href={job.webpage_url} target="_blank" rel="noopener noreferrer" className={styles.favLinkBtn}>Visa annons →</a>
              )}
              <button className={styles.stepBtnPrimary} onClick={() => checkCVAndStart(job)}>✨ Starta ansökan →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
