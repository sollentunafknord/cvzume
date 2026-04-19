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

  useEffect(() => {
    const handler = (e: Event) => setIsPro((e as CustomEvent).detail.isPro);
    window.addEventListener('cvita_pro_updated', handler);
    return () => window.removeEventListener('cvita_pro_updated', handler);
  }, []);

  const activeApps = apps.filter(a => a.status !== 'archived');
  const archivedApps = apps.filter(a => a.status === 'archived');
  const sentCount = activeApps.filter(a => a.status === 'sent').length;
  const avgMatch = activeApps.length
    ? Math.round(activeApps.reduce((s, a) => s + (a.match_score || 0), 0) / activeApps.length)
    : 0;

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


  return (
    <>
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>
              {view === 'dashboard' ? t('nav.dashboard') : view === 'applications' ? t('nav.applications') : t('nav.archive')}
            </span>
          </div>
          <div className={styles.topbarRight} />
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
              </div>

              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>Aktiva ansökningar</div>
                    <div className={styles.statValue}>{activeApps.length}</div>
                    <div className={styles.statSub}>{activeApps.length - sentCount} utkast</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siBlue}`} style={{ fontSize: 22 }}>📋</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>Skickade ansökningar</div>
                    <div className={styles.statValue}>{sentCount}</div>
                    <div className={`${styles.statSub} ${sentCount > 0 ? '' : styles.neutral}`}>
                      {sentCount > 0 ? 'skickade' : 'Inga skickade än'}
                    </div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siGreen}`} style={{ fontSize: 22 }}>✅</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>Snitt matchning</div>
                    <div className={styles.statValue}>{activeApps.length ? `${avgMatch}%` : '–'}</div>
                    <div className={styles.statSub}>genomsnitt</div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siAmber}`} style={{ fontSize: 22 }}>🎯</div>
                </div>
                <div className={styles.statCard}>
                  <div>
                    <div className={styles.statLabel}>Senaste aktivitet</div>
                    <div className={styles.statValue} style={{ fontSize: 16, fontWeight: 600 }}>
                      {events.length > 0 ? events[0].title.slice(0, 18) + (events[0].title.length > 18 ? '…' : '') : '–'}
                    </div>
                    <div className={`${styles.statSub} ${styles.neutral}`}>
                      {events.length > 0 ? (events[0].type === 'favorite' ? '★ Favorit' : '📋 Ansökan') : 'Inga händelser'}
                    </div>
                  </div>
                  <div className={`${styles.statIcon} ${styles.siPurple}`} style={{ fontSize: 22 }}>⚡</div>
                </div>
              </div>

              <div className={styles.dashboardGrid}>
                <div>
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionTitleSm}>Senaste 5 händelser</span>
                  </div>
                  <div className={styles.activityCard}>
                    <div className={styles.activityList}>
                      {events.length === 0
                        ? <div className={styles.noActivity}>Inga händelser än — lägg till favoriter eller skicka ansökningar</div>
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
                <div className={styles.pageSub}>{activeApps.length} aktiva · {sentCount} skickade</div>
              </div>

              {/* Väntar på svar */}
              <div className={styles.appSection}>
                <div className={styles.appSectionHeader}>
                  <span className={styles.appSectionDot} style={{ background: '#1A56DB' }} />
                  <span className={styles.appSectionTitle}>Väntar på svar</span>
                  <span className={styles.appSectionCount}>{apps.filter(a => a.status === 'sent' || a.status === 'draft').length}</span>
                </div>
                {apps.filter(a => a.status === 'sent' || a.status === 'draft').length === 0
                  ? <div className={styles.appSectionEmpty}>Inga aktiva ansökningar</div>
                  : apps.filter(a => a.status === 'sent' || a.status === 'draft').map(app => (
                    <div key={app.id} className={styles.appItem}>
                      <div className={styles.appInfo}>
                        <div className={styles.appRole}>{app.role}</div>
                        <div className={styles.appCompany}>{formatDate(app.created_at, locale)} · {app.status === 'sent' ? 'Skickad' : 'Utkast'}</div>
                      </div>
                      <div className={styles.appMeta}>
                        <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0, styles)}`}>{app.match_score || 0}%</span>
                        <button className={styles.appActionBtn} style={{ background: '#DCFCE7', color: '#16A34A' }} onClick={() => patchApp(app.id, 'interview')}>✓ Kallad till intervju</button>
                        <button className={styles.appActionBtn} style={{ background: '#FEE2E2', color: '#DC2626' }} onClick={() => patchApp(app.id, 'rejected')}>✗ Fått avslag</button>
                        <div className={styles.iconBtn} onClick={() => deleteApp(app.id, app.role)}>🗑️</div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Kallad till intervju */}
              <div className={styles.appSection}>
                <div className={styles.appSectionHeader}>
                  <span className={styles.appSectionDot} style={{ background: '#16A34A' }} />
                  <span className={styles.appSectionTitle}>Kallad till intervju</span>
                  <span className={styles.appSectionCount}>{apps.filter(a => a.status === 'interview').length}</span>
                </div>
                {apps.filter(a => a.status === 'interview').length === 0
                  ? <div className={styles.appSectionEmpty}>Inga intervjuer än — lycka till!</div>
                  : apps.filter(a => a.status === 'interview').map(app => (
                    <div key={app.id} className={styles.appItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div className={styles.appInfo} style={{ flex: 1 }}>
                          <div className={styles.appRole}>{app.role}</div>
                          <div className={styles.appCompany}>{formatDate(app.created_at, locale)}</div>
                        </div>
                        <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0, styles)}`}>{app.match_score || 0}%</span>
                        <button className={styles.appActionBtn} style={{ background: '#F1F5F9', color: '#475569' }} onClick={() => patchApp(app.id, 'sent')}>↩ Tillbaka</button>
                        <div className={styles.iconBtn} onClick={() => deleteApp(app.id, app.role)}>🗑️</div>
                      </div>
                      <div className={styles.interviewTips}>
                        <div className={styles.interviewTipsTitle}>Intervjuförberedelse för {app.role}</div>
                        <div className={styles.interviewTipsList}>
                          {[
                            'Researcha företaget — läs om deras mission, produkter och senaste nyheter',
                            'Förbered 3–5 konkreta exempel på dina prestationer (STAR-metoden: Situation, Task, Action, Result)',
                            'Öva på vanliga frågor: "Berätta om dig själv", "Varför vill du jobba här?", "Vad är din svaghet?"',
                            'Förbered egna frågor att ställa till intervjuaren',
                            'Kolla upp lön för liknande roller — var redo att diskutera',
                            'Testa din teknik om det är en videointervju (ljud, kamera, bakgrund)',
                          ].map((tip, i) => (
                            <div key={i} className={styles.interviewTip}>
                              <span className={styles.interviewTipNum}>{i + 1}</span>
                              <span>{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Fått avslag */}
              {apps.filter(a => a.status === 'rejected').length > 0 && (
                <div className={styles.appSection}>
                  <div className={styles.appSectionHeader}>
                    <span className={styles.appSectionDot} style={{ background: '#DC2626' }} />
                    <span className={styles.appSectionTitle}>Fått avslag</span>
                    <span className={styles.appSectionCount}>{apps.filter(a => a.status === 'rejected').length}</span>
                  </div>
                  {apps.filter(a => a.status === 'rejected').map(app => (
                    <div key={app.id} className={styles.appItem} style={{ opacity: 0.85 }}>
                      <div className={styles.appInfo}>
                        <div className={styles.appRole}>{app.role}</div>
                        <div className={styles.appCompany}>{formatDate(app.created_at, locale)}</div>
                      </div>
                      <div className={styles.appMeta}>
                        <span className={`${styles.scoreBadge} ${scoreClass(app.match_score || 0, styles)}`}>{app.match_score || 0}%</span>
                        <button className={styles.appActionBtn} style={{ background: '#F1F5F9', color: '#475569' }} onClick={() => patchApp(app.id, 'archived')}>📁 Arkivera</button>
                        <div className={styles.iconBtn} onClick={() => deleteApp(app.id, app.role)}>🗑️</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
