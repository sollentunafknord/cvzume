'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import styles from './dashboard.module.css';

interface AnalysisResult {
  matchScore: number;
  cvSummary: string;
  coverLetter: string;
  keyRequirements: string[];
  tips: string[];
  provider: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  isPro: boolean;
  onUsageLimitHit: () => void;
  onAnalysisComplete: (result: AnalysisResult, role: string) => void;
  onApplicationSaved: () => void;
}

interface TaxItem { id: string; label: string; parentId?: string; }
interface JobHit {
  id: string;
  headline: string;
  employer?: { name?: string };
  workplace_address?: { municipality?: string };
  description?: { text?: string };
}

export default function NewApplicationModal({ open, onClose, isPro, onUsageLimitHit, onAnalysisComplete, onApplicationSaved }: Props) {
  const t = useTranslations();
  const locale = useLocale();

  const [modalTab, setModalTab] = useState<'search' | 'paste'>('search');
  const [modalRole, setModalRole] = useState('');
  const [modalAd, setModalAd] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeSteps, setAnalyzeSteps] = useState([0, 0, 0, 0]);
  const [analyzeMsg, setAnalyzeMsg] = useState('');

  const [jobRegions, setJobRegions] = useState<TaxItem[]>([]);
  const [jobMunis, setJobMunis] = useState<TaxItem[]>([]);
  const [jobFields, setJobFields] = useState<TaxItem[]>([]);
  const [jobGroups, setJobGroups] = useState<TaxItem[]>([]);
  const [jobSelRegion, setJobSelRegion] = useState('');
  const [jobSelMuni, setJobSelMuni] = useState('');
  const [jobSelField, setJobSelField] = useState('');
  const [jobSelGroup, setJobSelGroup] = useState('');
  const [jobQuery, setJobQuery] = useState('');
  const [jobResults, setJobResults] = useState<JobHit[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobSearched, setJobSearched] = useState(false);

  // Load prefill from localStorage
  useEffect(() => {
    const prefill = localStorage.getItem('cvita_prefill_job');
    if (prefill) {
      try {
        const { role, description } = JSON.parse(prefill);
        setModalRole(role || '');
        setModalAd(description || '');
        setModalTab('paste');
        localStorage.removeItem('cvita_prefill_job');
      } catch { /* ignore */ }
    }
  }, [open]);

  // Load taxonomy once when modal first opens
  useEffect(() => {
    if (!open || jobRegions.length > 0) return;
    Promise.all([
      fetch('/api/jobs/taxonomy?type=region&limit=30').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=municipality&limit=400').then(r => r.json()),
      fetch('/api/jobs/taxonomy?type=occupation-field&limit=50').then(r => r.json()),
    ]).then(([reg, mun, field]) => {
      setJobRegions((reg.data || []).map((x: {id:string;preferred_label:string}) => ({ id: x.id, label: x.preferred_label })));
      setJobMunis((mun.data || []).map((x: {id:string;preferred_label:string}) => ({ id: x.id, label: x.preferred_label, parentId: '' })));
      setJobFields((field.data || []).map((x: {id:string;preferred_label:string}) => ({ id: x.id, label: x.preferred_label })));
      setJobGroups([]);
    }).catch(() => {});
  }, [open, jobRegions.length]);

  async function searchJobs() {
    setJobLoading(true);
    setJobSearched(true);
    const params = new URLSearchParams({ limit: '8', offset: '0' });
    if (jobQuery.trim()) params.set('q', jobQuery.trim());
    if (jobSelMuni) params.set('municipality', jobSelMuni);
    else if (jobSelRegion) params.set('region', jobSelRegion);
    if (jobSelGroup) params.set('occupation-group', jobSelGroup);
    else if (jobSelField) params.set('occupation-field', jobSelField);
    try {
      const res = await fetch(`/api/jobs/search?${params}`);
      const data = await res.json();
      setJobResults(data.hits || []);
      setJobTotal(data.total?.value || 0);
    } catch { setJobResults([]); }
    setJobLoading(false);
  }

  function pickJob(job: JobHit) {
    setModalRole(job.headline);
    setModalAd(job.description?.text?.replace(/<[^>]+>/g, '') || '');
    setModalTab('paste');
  }

  async function checkUsage(): Promise<boolean> {
    if (isPro) return true;
    const token = localStorage.getItem('cvita_token');
    const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const thisMonth = new Date().toISOString().slice(0, 7) + '-01';
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/usage_limits?user_id=eq.${user.id}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
      });
      const rows = await res.json();
      let cvCount = 0;
      let resetDate = thisMonth;
      if (rows.length > 0) {
        const row = rows[0];
        if (row.reset_date && row.reset_date.slice(0, 7) < thisMonth.slice(0, 7)) {
          cvCount = 0; resetDate = thisMonth;
        } else {
          cvCount = row.cv_count || 0; resetDate = row.reset_date || thisMonth;
        }
      }
      if (cvCount >= 2) return false;
      await fetch(`${supabaseUrl}/rest/v1/usage_limits`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey, Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ user_id: user.id, cv_count: cvCount + 1, reset_date: resetDate }),
      });
      return true;
    } catch { return true; }
  }

  async function startAnalysis() {
    if (!modalRole || !modalAd) { alert('Fyll i roll och annonstext.'); return; }
    const allowed = await checkUsage();
    if (!allowed) { onClose(); onUsageLimitHit(); return; }

    setAnalyzing(true);
    setAnalyzeMsg('AI:n analyserar annonsen...');
    setAnalyzeSteps([1, 0, 0, 0]);

    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    try {
      setTimeout(() => setAnalyzeSteps([2, 1, 0, 0]), 800);
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: modalAd, userProfile: profile, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI fel');

      setAnalyzeSteps([2, 2, 1, 0]);
      await new Promise(r => setTimeout(r, 600));
      setAnalyzeSteps([2, 2, 2, 1]);
      await new Promise(r => setTimeout(r, 600));
      setAnalyzeSteps([2, 2, 2, 2]);
      setAnalyzeMsg('🎉 Klart! CV och brev är redo.');

      localStorage.setItem('cvita_last_result', JSON.stringify({ role: modalRole, ...data }));

      const token = localStorage.getItem('cvita_token');
      if (token) {
        fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: token, role: modalRole, jobAd: modalAd,
            matchScore: data.matchScore, cvSummary: data.cvSummary,
            coverLetter: data.coverLetter, keyRequirements: data.keyRequirements,
            tips: data.tips, provider: data.provider,
          }),
        }).then(() => {
          onApplicationSaved();
          fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              type: 'application',
              title: modalRole,
              subtitle: `${data.matchScore}% match`,
            }),
          }).catch(() => {});
        }).catch(() => {});
      }

      await new Promise(r => setTimeout(r, 800));
      const role = modalRole;
      setModalOpen_internal(false);
      onAnalysisComplete(data, role);
      setModalRole('');
      setModalAd('');
    } catch (err: unknown) {
      setAnalyzeMsg('❌ Något gick fel: ' + (err instanceof Error ? err.message : 'okänt fel'));
    } finally {
      setAnalyzing(false);
    }
  }

  function setModalOpen_internal(val: boolean) {
    if (!val) { onClose(); setAnalyzing(false); }
  }

  function stepClass(idx: number) {
    const s = analyzeSteps[idx];
    if (s === 2) return `${styles.analyzingStep} ${styles.done}`;
    if (s === 1) return `${styles.analyzingStep} ${styles.active}`;
    return styles.analyzingStep;
  }
  function stepIcon(idx: number) { return analyzeSteps[idx] === 2 ? '✓' : analyzeSteps[idx] === 1 ? '⟳' : '○'; }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setModalOpen_internal(false); }}>
      <div className={styles.modal} style={{ maxWidth: modalTab === 'search' && !analyzing ? 700 : 540 }}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>{t('modal.new_title')}</div>
          <div className={styles.modalClose} onClick={() => setModalOpen_internal(false)}>✕</div>
        </div>

        {!analyzing ? (
          <>
            <div className={styles.modalTabs}>
              <button className={`${styles.modalTab} ${modalTab === 'search' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('search')}>
                🔍 Sök via Arbetsförmedlingen
              </button>
              <button className={`${styles.modalTab} ${modalTab === 'paste' ? styles.modalTabActive : ''}`} onClick={() => setModalTab('paste')}>
                📋 Klistra in annons
              </button>
            </div>

            {modalTab === 'search' && (
              <div className={styles.jobSearchTab}>
                <div className={styles.jobFilters}>
                  <select className={styles.jobSelect} value={jobSelRegion} onChange={e => { setJobSelRegion(e.target.value); setJobSelMuni(''); }}>
                    <option value="">🗺 Hela Sverige</option>
                    {jobRegions.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <select className={styles.jobSelect} value={jobSelMuni} onChange={e => setJobSelMuni(e.target.value)} disabled={!jobSelRegion}>
                    <option value="">Alla kommuner</option>
                    {jobMunis.filter(m => m.parentId === jobSelRegion).map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <select className={styles.jobSelect} value={jobSelField} onChange={e => { setJobSelField(e.target.value); setJobSelGroup(''); }}>
                    <option value="">💼 Alla yrken</option>
                    {jobFields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  <select className={styles.jobSelect} value={jobSelGroup} onChange={e => setJobSelGroup(e.target.value)} disabled={!jobSelField}>
                    <option value="">Alla grupper</option>
                    {jobGroups.filter(g => g.parentId === jobSelField).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </div>
                <div className={styles.jobSearchRow}>
                  <input className={styles.jobSearchInput} placeholder="Fritext, t.ex. Java-utvecklare..." value={jobQuery} onChange={e => setJobQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchJobs()} />
                  <button className={styles.jobSearchBtn} onClick={searchJobs} disabled={jobLoading}>{jobLoading ? '...' : 'Sök'}</button>
                </div>
                {jobSearched && <div className={styles.jobResultsCount}>{jobTotal.toLocaleString('sv-SE')} jobb hittades</div>}
                <div className={styles.jobResultsList}>
                  {jobResults.map(job => (
                    <div key={job.id} className={styles.jobResultItem}>
                      <div className={styles.jobResultInfo}>
                        <div className={styles.jobResultTitle}>{job.headline}</div>
                        <div className={styles.jobResultMeta}>
                          {job.employer?.name && <span>{job.employer.name}</span>}
                          {job.workplace_address?.municipality && <span>📍 {job.workplace_address.municipality}</span>}
                        </div>
                      </div>
                      <button className={styles.jobPickBtn} onClick={() => pickJob(job)}>Välj →</button>
                    </div>
                  ))}
                  {jobSearched && !jobLoading && jobResults.length === 0 && <div className={styles.jobNoResults}>Inga jobb hittades.</div>}
                </div>
              </div>
            )}

            {modalTab === 'paste' && (
              <div className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('modal.role_label')}</label>
                  <input className={styles.formInput} type="text" placeholder={t('modal.role_placeholder')} value={modalRole} onChange={e => setModalRole(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('modal.ad_label')}</label>
                  <textarea className={`${styles.formInput} ${styles.formTextarea}`} placeholder={t('modal.ad_placeholder')} value={modalAd} onChange={e => setModalAd(e.target.value)} />
                  <span className={styles.formHint}>AI:n analyserar annonsen och anpassar ditt CV automatiskt.</span>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.btnModalCancel} onClick={() => setModalOpen_internal(false)}>{t('modal.cancel')}</button>
                  <button className={styles.btnModalSubmit} onClick={startAnalysis}>{t('modal.analyze_btn')}</button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className={`${styles.analyzing} ${styles.show}`}>
            <div className={styles.spinner} />
            <div className={styles.analyzingText}>{analyzeMsg}</div>
            <div className={styles.analyzingSteps}>
              <div className={stepClass(0)}>{stepIcon(0)} Annons inläst</div>
              <div className={stepClass(1)}>{stepIcon(1)} Extraherar nyckelkrav...</div>
              <div className={stepClass(2)}>{stepIcon(2)} Anpassar ditt CV</div>
              <div className={stepClass(3)}>{stepIcon(3)} Genererar personligt brev</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
