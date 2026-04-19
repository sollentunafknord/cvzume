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
    if (localStorage.getItem('cvita_prefill_job')) setModalOpen(true);
  }, [locale, loadUser, loadApplications, loadEvents]);

  useEffect(() => {
    const handler = (e: Event) => setIsPro((e as CustomEvent).detail.isPro);
    window.addEventListener('cvita_pro_updated', handler);
    return () => window.removeEventListener('cvita_pro_updated', handler);
  }, []);

  const activeApps = apps.filter(a => a.status !== 'archived' && a.status !== 'rejected');
  const sentCount = apps.filter(a => a.status === 'sent').length;
  const interviewCount = apps.filter(a => a.status === 'interview').length;
  const avgMatch = activeApps.length
    ? Math.round(activeApps.reduce((s, a) => s + (a.match_score || 0), 0) / activeApps.length)
    : 0;

  return (
    <>
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarTitle}>{t('nav.dashboard')}</span>
          </div>
          <div className={styles.topbarRight} />
        </div>

        <div className={styles.content}>
          <div className={styles.welcomeBanner}>
            <div className={styles.welcomeText}>
              <div className={styles.welcomeGreeting}>{todayStr}</div>
              <div className={styles.welcomeName}>{t('dashboard.greeting', { name: userName.split(' ')[0] })}</div>
              <div className={styles.welcomeSub}>
                {sentCount} {t('dashboard.sent_apps').toLowerCase()} · {interviewCount} {t('dashboard.interviews').toLowerCase()}
              </div>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>{t('dashboard.sent_apps')}</div>
                <div className={styles.statValue}>{sentCount}</div>
                <div className={`${styles.statSub} ${sentCount > 0 ? '' : styles.neutral}`}>
                  {sentCount > 0 ? t('dashboard.waiting_answer') : t('dashboard.no_sent_yet')}
                </div>
              </div>
              <div className={`${styles.statIcon} ${styles.siBlue}`} style={{ fontSize: 22 }}>📤</div>
            </div>
            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>{t('dashboard.interviews')}</div>
                <div className={styles.statValue}>{interviewCount}</div>
                <div className={`${styles.statSub} ${interviewCount > 0 ? '' : styles.neutral}`}>
                  {interviewCount > 0 ? t('dashboard.called_interview') : t('dashboard.no_interviews_yet')}
                </div>
              </div>
              <div className={`${styles.statIcon} ${styles.siGreen}`} style={{ fontSize: 22 }}>🎯</div>
            </div>
            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>{t('dashboard.avg_match_label')}</div>
                <div className={styles.statValue}>{activeApps.length ? `${avgMatch}%` : '–'}</div>
                <div className={styles.statSub}>{t('dashboard.avg_match_sub')}</div>
              </div>
              <div className={`${styles.statIcon} ${styles.siAmber}`} style={{ fontSize: 22 }}>📊</div>
            </div>
            <div className={styles.statCard}>
              <div>
                <div className={styles.statLabel}>{t('dashboard.recent_activity_label')}</div>
                <div className={styles.statValue} style={{ fontSize: 16, fontWeight: 600 }}>
                  {events.length > 0 ? events[0].title.slice(0, 18) + (events[0].title.length > 18 ? '…' : '') : '–'}
                </div>
                <div className={`${styles.statSub} ${styles.neutral}`}>
                  {events.length > 0 ? (events[0].type === 'favorite' ? t('dashboard.event_favorite') : t('dashboard.event_application')) : t('dashboard.no_events_label')}
                </div>
              </div>
              <div className={`${styles.statIcon} ${styles.siPurple}`} style={{ fontSize: 22 }}>⚡</div>
            </div>
          </div>

          <div className={styles.dashboardGrid}>
            <div>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitleSm}>{t('dashboard.recent_events')}</span>
              </div>
              <div className={styles.activityCard}>
                <div className={styles.activityList}>
                  {events.length === 0
                    ? <div className={styles.noActivity}>{t('dashboard.no_events_hint')}</div>
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
                  <button className={styles.quickAction} onClick={() => goTo('skickade')}>
                    <div className={`${styles.qaIcon} ${styles.qaGreen}`}>📤</div>
                    <div className={styles.qaText}>
                      <div className={styles.qaTitle}>{t('dashboard.shortcut_sent_title')}</div>
                      <div className={styles.qaSub}>{t('dashboard.shortcut_sent_sub')}</div>
                    </div>
                    <span className={styles.qaArrow}>→</span>
                  </button>
                  <button className={styles.quickAction} onClick={() => goTo('intervju')}>
                    <div className={`${styles.qaIcon} ${styles.qaAmber}`}>🎯</div>
                    <div className={styles.qaText}>
                      <div className={styles.qaTitle}>{t('dashboard.shortcut_intervju_title')}</div>
                      <div className={styles.qaSub}>{t('dashboard.shortcut_intervju_sub')}</div>
                    </div>
                    <span className={styles.qaArrow}>→</span>
                  </button>
                </div>
              </div>

              {!isPro && apps.length >= 2 && (
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

      {showResult && result && (
        <div className={styles.resultOverlay} onClick={e => { if (e.target === e.currentTarget) setShowResult(false); }}>
          <div className={styles.resultModal}>
            <div className={styles.resultHeader}>
              <div>
                <div className={styles.resultTitle}>{resultRole}</div>
                <div className={styles.resultSub}>{t('dashboard.ai_analysis_done')} · {result.provider || 'AI'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={styles.matchBadge}>{result.matchScore}% match</span>
                <button className={styles.resultClose} onClick={() => setShowResult(false)}>✕</button>
              </div>
            </div>
            <div className={styles.resultBody}>
              {result.keyRequirements?.length > 0 && (
                <div>
                  <div className={styles.resultSectionTitle}>{t('dashboard.result_key_req')}</div>
                  <div className={styles.requirementTags}>
                    {result.keyRequirements.map((r, i) => <span key={i} className={styles.requirementTag}>{r}</span>)}
                  </div>
                </div>
              )}
              <div>
                <div className={styles.resultSectionTitle}>{t('dashboard.result_cv_summary')}</div>
                <div className={styles.resultTextBlock}>{result.cvSummary}</div>
              </div>
              <div>
                <div className={styles.resultSectionTitle}>{t('dashboard.result_cover_letter')}</div>
                <div className={styles.resultTextBlock} style={{ whiteSpace: 'pre-line' }}>{result.coverLetter}</div>
              </div>
              {result.tips?.length > 0 && (
                <div>
                  <div className={styles.resultSectionTitle}>{t('dashboard.result_tips')}</div>
                  {result.tips.map((tip, i) => (
                    <div key={i} className={styles.tipItem}><span className={styles.tipArrow}>→</span>{tip}</div>
                  ))}
                </div>
              )}
              <div className={styles.resultActions}>
                <button className={styles.resultActionBtn} onClick={() => goTo('letter')}>{t('dashboard.result_btn_letter')}</button>
                <button className={styles.resultActionBtn} onClick={() => goTo('cv')}>{t('dashboard.result_btn_cv')}</button>
                <button className={`${styles.resultActionBtn} ${styles.resultActionBtnPrimary}`} onClick={() => setShowResult(false)}>{t('dashboard.result_btn_close')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
