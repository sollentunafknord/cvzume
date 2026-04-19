'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import NewApplicationModal from './NewApplicationModal';

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

function scoreClass(score: number, s: Record<string, string>) {
  return score >= 80 ? s.scoreHigh : score >= 60 ? s.scoreMid : s.scoreLow;
}

function formatDate(dateStr: string, locale: string) {
  const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
  return new Date(dateStr).toLocaleDateString(localeMap[locale] || 'sv-SE', {
    day: 'numeric', month: 'short', year: 'numeric',
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
  const [isPro, setIsPro] = useState(false);
  const [todayStr, setTodayStr] = useState('');

  const [events, setEvents] = useState<{ id: string; type: string; title: string; subtitle: string | null; created_at: string }[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [resultRole, setResultRole] = useState('');
  const [showResult, setShowResult] = useState(false);

  const loadUser = useCallback(() => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const firstName = user.firstName || user.email?.split('@')[0] || '';
    const lastName = user.lastName || '';
    setUserName((firstName + ' ' + lastName).trim() || user.email);
    setIsPro(localStorage.getItem('cvita_is_pro') === 'true');
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

  const loadEvents = useCallback(async () => {
    const token = localStorage.getItem('cvita_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/events?token=${token}`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const localeMap: Record<string, string> = { en: 'en-GB', es: 'es-ES', tr: 'tr-TR', sv: 'sv-SE' };
    const str = new Date().toLocaleDateString(localeMap[locale] || 'sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    setTodayStr(str.charAt(0).toUpperCase() + str.slice(1));
    loadUser();
    loadApplications();
    loadEvents();

    if (localStorage.getItem('cvita_prefill_job')) {
      setModalOpen(true);
    }
  }, [locale, loadUser, loadApplications, loadEvents]);

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
    if (!confirm(`Delete "${role}"? This cannot be undone.`)) return;
    const token = localStorage.getItem('cvita_token');
    await fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setApps(prev => prev.filter(a => a.id !== id));
  }

  function AppList({ list }: { list: Application[] }) {
    if (list.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📭</div>
          <div className={styles.emptyTitle}>{t('dashboard.no_applications')}</div>
          <div className={styles.emptySub}>{t('dashboard.no_applications_sub')}</div>
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
                <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0, styles)}`}>
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
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>
              {view === 'dashboard' ? t('nav.dashboard') : view === 'applications' ? t('nav.applications') : t('nav.archive')}
            </span>
          </div>
          <div className={styles.topbarRight}>
            <button className={`${styles.topbarBtn} ${styles.topbarBtnPrimary}`} onClick={() => setModalOpen(true)}>
              ＋ {t('dashboard.new_application')}
            </button>
          </div>
        </div>

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
                  <button className={styles.btnNewApp} onClick={() => setModalOpen(true)}>
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
                      <button className={styles.quickAction} onClick={() => setModalOpen(true)}>
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
                    <div className={styles.sectionTitleSm}>Senaste händelser</div>
                    <div className={styles.activityList}>
                      {events.length === 0
                        ? <div className={styles.noActivity}>Inga händelser än</div>
                        : events.map(e => (
                          <div key={e.id} className={styles.activityItem}>
                            <span className={styles.activityDot} style={{ background: e.type === 'favorite' ? '#F59E0B' : '#1A56DB' }} />
                            <span style={{ flex: 1 }}>
                              <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 6 }}>
                                {e.type === 'favorite' ? '★' : '📋'}
                              </span>
                              {e.title}
                              {e.subtitle && <span style={{ color: '#94A3B8', fontSize: 12, marginLeft: 6 }}>{e.subtitle}</span>}
                            </span>
                            <span className={styles.activityDate}>{formatDate(e.created_at, locale)}</span>
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
                        <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0, styles)}`}>
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

      <NewApplicationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isPro={isPro}
        onUsageLimitHit={() => setShowUpgrade(true)}
        onAnalysisComplete={(res, role) => {
          setResult(res);
          setResultRole(role);
          setShowResult(true);
        }}
        onApplicationSaved={loadApplications}
      />

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
