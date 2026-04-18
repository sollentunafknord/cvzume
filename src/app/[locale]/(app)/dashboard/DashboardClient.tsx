'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import ApplicationsClient from '../applications/ApplicationsClient';

interface Application {
  id: string;
  role: string;
  match_score: number;
  status: string;
  created_at: string;
}

interface AnalysisResult {
  matchScore: number;
  cvSummary: string;
  coverLetter: string;
  keyRequirements: string[];
  tips: string[];
  provider: string;
}

type View = 'dashboard' | 'applications' | 'archive';
type AppFilter = 'all' | 'draft' | 'sent';

function scoreClass(score: number) {
  return score >= 80 ? styles.scoreHigh : score >= 60 ? styles.scoreMid : styles.scoreLow;
}

function formatDate(dateStr: string, locale: string) {
  const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
  return new Date(dateStr).toLocaleDateString(localeMap[locale] || 'sv-SE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

export default function DashboardClient({ onNavigate }: { onNavigate?: (seg: string) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  function goTo(seg: string) {
    if (onNavigate) onNavigate(seg);
    else router.push(`/${locale}/${seg}`);
  }

  const [view, setView] = useState<View>('dashboard');
  const [apps, setApps] = useState<Application[]>([]);
  const [appFilter, setAppFilter] = useState<AppFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState('');
  const [modalAd, setModalAd] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeSteps, setAnalyzeSteps] = useState([0, 0, 0, 0]);
  const [analyzeMsg, setAnalyzeMsg] = useState('');

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultRole, setResultRole] = useState('');
  const [showResult, setShowResult] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [jobSearchOpen, setJobSearchOpen] = useState(false);

  const loadUser = useCallback(() => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const firstName = user.firstName || user.email?.split('@')[0] || '';
    const lastName = user.lastName || '';
    setUserName((firstName + ' ' + lastName).trim() || user.email);
    setUserEmail(user.email || '');

    const pro = localStorage.getItem('cvita_is_pro') === 'true';
    setIsPro(pro);
  }, [locale, router]);

  const loadApplications = useCallback(async () => {
    const token = localStorage.getItem('cvita_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/applications?token=${token}`);
      const data = await res.json();
      if (data.applications) setApps(data.applications);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
    const str = new Date().toLocaleDateString(localeMap[locale] || 'sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    setTodayStr(str.charAt(0).toUpperCase() + str.slice(1));
    loadUser();
    loadApplications();

    const prefill = localStorage.getItem('cvita_prefill_job');
    if (prefill) {
      try {
        const { role, description } = JSON.parse(prefill);
        setModalRole(role || '');
        setModalAd(description || '');
        setModalOpen(true);
        localStorage.removeItem('cvita_prefill_job');
      } catch { /* ignore */ }
    }
  }, [locale, loadUser, loadApplications]);

  const activeApps = apps.filter(a => a.status !== 'archived');
  const archivedApps = apps.filter(a => a.status === 'archived');
  const sentCount = activeApps.filter(a => a.status === 'sent').length;
  const avgMatch = activeApps.length
    ? Math.round(activeApps.reduce((s, a) => s + (a.match_score || 0), 0) / activeApps.length)
    : 0;

  function filterApps(list: Application[]) {
    let filtered = list.filter(a => a.status !== 'archived');
    if (appFilter === 'draft') filtered = filtered.filter(a => (a.status || 'draft') === 'draft');
    if (appFilter === 'sent') filtered = filtered.filter(a => a.status === 'sent');
    if (searchQuery) filtered = filtered.filter(a => a.role?.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered;
  }

  async function patchApp(id: string, status: string) {
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function deleteApp(id: string, role: string) {
    if (!confirm(`Ta bort "${role}"? Denna åtgärd kan inte ångras.`)) return;
    if (!confirm('Är du helt säker?')) return;
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
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
    if (!allowed) { setModalOpen(false); setShowUpgrade(true); return; }

    setAnalyzing(true);
    setAnalyzeMsg('AI:n analyserar annonsen...');
    setAnalyzeSteps([1, 0, 0, 0]);

    const profile = JSON.parse(localStorage.getItem('cvita_profile') || '{}');
    try {
      setTimeout(() => setAnalyzeSteps([2, 1, 0, 0]), 800);
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: modalAd, userProfile: profile }),
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
        }).then(() => loadApplications()).catch(() => {});
      }

      await new Promise(r => setTimeout(r, 800));
      setModalOpen(false);
      setAnalyzing(false);
      setResultRole(modalRole);
      setResult(data);
      setShowResult(true);
      setModalRole('');
      setModalAd('');
    } catch (err: unknown) {
      setAnalyzeMsg('❌ Något gick fel: ' + (err instanceof Error ? err.message : 'okänt fel'));
    }
  }

  function stepClass(step: number, idx: number) {
    const s = analyzeSteps[idx];
    if (s === 2) return `${styles.analyzingStep} ${styles.done}`;
    if (s === 1) return `${styles.analyzingStep} ${styles.active}`;
    return styles.analyzingStep;
  }

  function stepIcon(idx: number) { return analyzeSteps[idx] === 2 ? '✓' : analyzeSteps[idx] === 1 ? '⟳' : '○'; }

  function AppList({ list }: { list: Application[] }) {
    if (list.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>Inga ansökningar</div>
          <div className={styles.emptySub}>Skapa din första ansökan ovan.</div>
        </div>
      );
    }
    return (
      <div className={styles.appList}>
        {list.map(app => {
          const isSent = app.status === 'sent';
          return (
            <div key={app.id} className={styles.appItem}>
              <div className={styles.appLogo}>⭐</div>
              <div className={styles.appInfo}>
                <div className={styles.appRole}>{app.role || 'Okänd roll'}</div>
                <div className={styles.appCompany}>{formatDate(app.created_at, locale)}</div>
              </div>
              <div className={styles.appMeta}>
                <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0)}`}>
                  {app.match_score || 0}% match
                </span>
                <span
                  className={`${styles.statusDot} ${isSent ? styles.sent : styles.draft}`}
                  onClick={() => patchApp(app.id, isSent ? 'draft' : 'sent')}
                >
                  {isSent ? t('dashboard.sent') : t('dashboard.draft')}
                </span>
                <div className={styles.appActions}>
                  <div className={styles.iconBtn} title="Ta bort" onClick={() => deleteApp(app.id, app.role)}>🗑️</div>
                  <div className={styles.iconBtn} title="Arkivera" onClick={() => patchApp(app.id, 'archived')}>📁</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
    <main className={styles.main}>
        {/* TOPBAR */}
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>
              {view === 'dashboard' ? t('nav.dashboard') : view === 'applications' ? t('nav.applications') : t('nav.archive')}
            </span>
          </div>
          <div className={styles.topbarRight}>
            <button className={`${styles.topbarBtn} ${styles.topbarBtnGhost}`} onClick={() => setModalOpen(true)}>
              📤 {t('dashboard.upload_cv')}
            </button>
            <button className={`${styles.topbarBtn} ${styles.topbarBtnPrimary}`} onClick={() => setJobSearchOpen(true)}>
              ＋ {t('dashboard.new_application')}
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className={styles.content}>

          {/* ── DASHBOARD VIEW ── */}
          {view === 'dashboard' && (
            <>
              <div className={styles.welcomeBanner}>
                <div className={styles.welcomeText}>
                  <div className={styles.welcomeGreeting}>{todayStr}</div>
                  <div className={styles.welcomeName}>Hej, {userName.split(' ')[0]}! 👋</div>
                  <div className={styles.welcomeSub}>
                    {activeApps.length} aktiva ansökningar · {sentCount} skickade
                  </div>
                </div>
                <div className={styles.welcomeAction}>
                  <button className={styles.btnNewApp} onClick={() => setJobSearchOpen(true)}>
                    ＋ {t('dashboard.new_application')}
                  </button>
                </div>
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>{t('dashboard.active_applications')}</div>
                    <div className={styles.statValue}>{activeApps.length}</div>
                    <div className={styles.statSub}>{sentCount} skickade</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siBlue}`}>📋</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>{t('dashboard.cvs_generated')}</div>
                    <div className={styles.statValue}>{activeApps.length}</div>
                    <div className={`${styles.statSub} ${styles.neutral}`}>totalt</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siGreen}`}>📄</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>{t('dashboard.avg_match')}</div>
                    <div className={styles.statValue}>{activeApps.length ? `${avgMatch}%` : '–'}</div>
                    <div className={styles.statSub}>genomsnitt</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siAmber}`}>🎯</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>{t('dashboard.pdfs_exported')}</div>
                    <div className={styles.statValue}>0</div>
                    <div className={`${styles.statSub} ${styles.neutral}`}>Inga PDF:er än</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siPurple}`}>📤</div>
                </div>
              </div>

              <div className={styles.dashboardGrid}>
                <div>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitleSm}>{t('dashboard.latest_applications')}</span>
                    <button className={styles.sectionLink} onClick={() => setView('applications')}>
                      {t('dashboard.see_all')}
                    </button>
                  </div>
                  <div className={styles.applicationsCard}>
                    <div className={styles.appCardHeader}>
                      <div className={styles.cardTabs}>
                        {(['all', 'draft', 'sent'] as AppFilter[]).map(f => (
                          <button
                            key={f}
                            className={`${styles.cardTab} ${appFilter === f ? styles.active : ''}`}
                            onClick={() => setAppFilter(f)}
                          >
                            {f === 'all' ? t('dashboard.all') : f === 'draft' ? t('dashboard.draft') : t('dashboard.sent')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <AppList list={filterApps(apps).slice(0, 5)} />
                  </div>
                </div>

                <div className={styles.rightCol}>
                  <div className={styles.quickCard}>
                    <div className={styles.sectionTitleSm}>{t('dashboard.shortcuts')}</div>
                    <div className={styles.quickActions}>
                      <button className={styles.quickAction} onClick={() => setJobSearchOpen(true)}>
                        <div className={`${styles.qaIcon} ${styles.qaBlue}`}>🔍</div>
                        <div className={styles.qaText}>
                          <div className={styles.qaTitle}>{t('dashboard.analyze_new')}</div>
                          <div className={styles.qaSub}>{t('dashboard.analyze_sub')}</div>
                        </div>
                        <span className={styles.qaArrow}>→</span>
                      </button>
                      <button className={styles.quickAction} onClick={() => goTo('cv')}>
                        <div className={`${styles.qaIcon} ${styles.qaGreen}`}>📄</div>
                        <div className={styles.qaText}>
                          <div className={styles.qaTitle}>{t('dashboard.update_cv')}</div>
                          <div className={styles.qaSub}>{t('dashboard.update_cv_sub')}</div>
                        </div>
                        <span className={styles.qaArrow}>→</span>
                      </button>
                      <button className={styles.quickAction} onClick={() => goTo('cv')}>
                        <div className={`${styles.qaIcon} ${styles.qaAmber}`}>📤</div>
                        <div className={styles.qaText}>
                          <div className={styles.qaTitle}>{t('dashboard.export_pdf')}</div>
                          <div className={styles.qaSub}>{t('dashboard.export_pdf_sub')}</div>
                        </div>
                        <span className={styles.qaArrow}>→</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.activityCard}>
                    <div className={styles.sectionTitleSm}>{t('dashboard.recent_activity')}</div>
                    <div className={styles.activityList}>
                      {apps.length === 0
                        ? <div className={styles.noActivity}>{t('dashboard.no_activity')}</div>
                        : apps.slice(0, 5).map(a => (
                          <div key={a.id} className={styles.activityItem}>
                            <span className={styles.activityDot} />
                            <span>{a.role}</span>
                            <span className={styles.activityDate}>{formatDate(a.created_at, locale)}</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {!isPro && activeApps.length >= 2 && (
                    <div className={styles.upgradeCard}>
                      <div className={styles.upgradeTitle}>{t('dashboard.upgrade_banner_title')}</div>
                      <div className={styles.upgradeSub}>{t('dashboard.upgrade_banner_desc')}</div>
                      <button className={styles.btnUpgrade} onClick={() => goTo('upgrade')}>
                        {t('dashboard.upgrade_btn')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── APPLICATIONS VIEW ── */}
          {view === 'applications' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div className={styles.pageTitle}>Mina ansökningar</div>
                <div className={styles.pageSub}>
                  {activeApps.length} ansökningar totalt · {sentCount} skickade
                </div>
              </div>
              <div className={styles.filterRow}>
                <div className={styles.cardTabs}>
                  {(['all', 'draft', 'sent'] as AppFilter[]).map(f => (
                    <button
                      key={f}
                      className={`${styles.cardTab} ${appFilter === f ? styles.active : ''}`}
                      onClick={() => setAppFilter(f)}
                    >
                      {f === 'all' ? t('dashboard.all') : f === 'draft' ? t('dashboard.draft') : t('dashboard.sent')}
                    </button>
                  ))}
                </div>
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="🔍 Sök roll..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className={styles.appsPageList}>
                <AppList list={filterApps(apps)} />
              </div>
            </div>
          )}

          {/* ── ARCHIVE VIEW ── */}
          {view === 'archive' && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div className={styles.pageTitle}>Arkiv</div>
                <div className={styles.pageSub}>Arkiverade ansökningar sparas här</div>
              </div>
              {archivedApps.length === 0 ? (
                <div className={styles.archiveEmpty}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                  <div className={styles.emptyTitle}>Inga arkiverade ansökningar</div>
                  <div className={styles.emptySub}>Ansökningar du arkiverar visas här</div>
                </div>
              ) : (
                <div className={styles.appList}>
                  {archivedApps.map(app => (
                    <div key={app.id} className={styles.appItem} style={{ opacity: 0.85 }}>
                      <div className={styles.appLogo}>📁</div>
                      <div className={styles.appInfo}>
                        <div className={styles.appRole}>{app.role || 'Okänd roll'}</div>
                        <div className={styles.appCompany}>Arkiverad · {formatDate(app.created_at, locale)}</div>
                      </div>
                      <div className={styles.appMeta}>
                        <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0)}`}>
                          {app.match_score || 0}% match
                        </span>
                        <div className={styles.appActions}>
                          <div className={styles.iconBtn} onClick={() => patchApp(app.id, 'draft')}>↩️</div>
                          <div className={styles.iconBtn} style={{ color: '#EF4444' }} onClick={() => deleteApp(app.id, app.role)}>🗑️</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── NEW APPLICATION MODAL ── */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); setAnalyzing(false); } }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{t('modal.new_title')}</div>
              <div className={styles.modalClose} onClick={() => { setModalOpen(false); setAnalyzing(false); }}>✕</div>
            </div>

            {!analyzing ? (
              <div className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('modal.role_label')}</label>
                  <input
                    className={styles.formInput}
                    type="text"
                    placeholder={t('modal.role_placeholder')}
                    value={modalRole}
                    onChange={e => setModalRole(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t('modal.ad_label')}</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    placeholder={t('modal.ad_placeholder')}
                    value={modalAd}
                    onChange={e => setModalAd(e.target.value)}
                  />
                  <span className={styles.formHint}>AI:n analyserar annonsen och anpassar ditt CV automatiskt.</span>
                </div>
                <div className={styles.modalActions}>
                  <button className={styles.btnModalCancel} onClick={() => setModalOpen(false)}>{t('modal.cancel')}</button>
                  <button className={styles.btnModalSubmit} onClick={startAnalysis}>{t('modal.analyze_btn')}</button>
                </div>
              </div>
            ) : (
              <div className={`${styles.analyzing} ${styles.show}`}>
                <div className={styles.spinner} />
                <div className={styles.analyzingText}>{analyzeMsg}</div>
                <div className={styles.analyzingSteps}>
                  <div className={stepClass(analyzeSteps[0], 0)}>{stepIcon(0)} Annons inläst</div>
                  <div className={stepClass(analyzeSteps[1], 1)}>{stepIcon(1)} Extraherar nyckelkrav...</div>
                  <div className={stepClass(analyzeSteps[2], 2)}>{stepIcon(2)} Anpassar ditt CV</div>
                  <div className={stepClass(analyzeSteps[3], 3)}>{stepIcon(3)} Genererar personligt brev</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RESULT MODAL ── */}
      {showResult && result && (
        <div className={styles.resultOverlay} onClick={e => { if (e.target === e.currentTarget) setShowResult(false); }}>
          <div className={styles.resultModal}>
            <div className={styles.resultHeader}>
              <div>
                <div className={styles.resultTitle}>{resultRole}</div>
                <div className={styles.resultSub}>AI analys klar · {result.provider || 'AI'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={styles.matchBadge}>{result.matchScore}% match</span>
                <button className={styles.resultClose} onClick={() => setShowResult(false)}>✕</button>
              </div>
            </div>
            <div className={styles.resultBody}>
              {result.keyRequirements?.length > 0 && (
                <div>
                  <div className={styles.resultSectionTitle}>🎯 Nyckelkrav</div>
                  <div className={styles.requirementTags}>
                    {result.keyRequirements.map((r, i) => <span key={i} className={styles.requirementTag}>{r}</span>)}
                  </div>
                </div>
              )}
              <div>
                <div className={styles.resultSectionTitle}>📄 CV Sammanfattning</div>
                <div className={styles.resultTextBlock}>{result.cvSummary}</div>
              </div>
              <div>
                <div className={styles.resultSectionTitle}>✉️ Personligt Brev</div>
                <div className={styles.resultTextBlock} style={{ whiteSpace: 'pre-line' }}>{result.coverLetter}</div>
              </div>
              {result.tips?.length > 0 && (
                <div>
                  <div className={styles.resultSectionTitle}>💡 Tips</div>
                  {result.tips.map((tip, i) => (
                    <div key={i} className={styles.tipItem}><span className={styles.tipArrow}>→</span>{tip}</div>
                  ))}
                </div>
              )}
              <div className={styles.resultActions}>
                <button className={styles.resultActionBtn} onClick={() => goTo('letter')}>✉️ Personligt Brev</button>
                <button className={styles.resultActionBtn} onClick={() => goTo('cv')}>📄 Ladda ner CV</button>
                <button className={`${styles.resultActionBtn} ${styles.resultActionBtnPrimary}`} onClick={() => setShowResult(false)}>Stäng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB SEARCH MODAL ── */}
      {jobSearchOpen && (
        <div className={styles.jobSearchOverlay}>
          <div className={styles.jobSearchPanel}>
            <div className={styles.jobSearchHeader}>
              <span className={styles.jobSearchTitle}>🔍 Sök jobb via Arbetsförmedlingen</span>
              <button className={styles.modalClose} onClick={() => setJobSearchOpen(false)}>✕</button>
            </div>
            <div className={styles.jobSearchBody}>
              <ApplicationsClient
                isModal
                onAnalyze={(role, description) => {
                  setJobSearchOpen(false);
                  setModalRole(role);
                  setModalAd(description);
                  setModalOpen(true);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── UPGRADE MODAL ── */}
      {showUpgrade && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false); }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>{t('limit.title')}</div>
              <div className={styles.modalClose} onClick={() => setShowUpgrade(false)}>✕</div>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <p style={{ fontSize: 14, color: '#475569', marginBottom: 20, lineHeight: 1.6 }}>{t('limit.desc')}</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className={styles.btnModalCancel} onClick={() => setShowUpgrade(false)}>{t('limit.close')}</button>
                <button className={styles.btnModalSubmit} onClick={() => { setShowUpgrade(false); goTo('upgrade'); }}>{t('limit.upgrade')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}