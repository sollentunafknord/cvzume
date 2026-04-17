'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from '../profile/profile.module.css'; // reuse sidebar CSS

interface Application {
  id: string;
  role: string;
  match_score: number;
  status: string;
  created_at: string;
}

function scoreClass(score: number) {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-mid';
  return 'score-low';
}

export default function ArchiveClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initials, setInitials] = useState('?');
  const [userName, setUserName] = useState('');
  const [planLabel, setPlanLabel] = useState('');

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const load = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setUserName((fn + ' ' + ln).trim() || user.email);
    setInitials(((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?');
    setPlanLabel(localStorage.getItem('cvita_is_pro') === 'true' ? t('dashboard.pro_plan') : t('dashboard.free_plan'));

    const token = localStorage.getItem('cvita_token');
    if (!token) { router.push(`/${locale}/auth`); return; }
    try {
      const res = await fetch(`/api/applications?token=${token}`);
      const data = await res.json();
      setApps((data.applications || []).filter((a: Application) => a.status === 'archived'));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [locale, router, t]);

  useEffect(() => { load(); }, [load]);

  function handleLogout() {
    localStorage.removeItem('cvita_token');
    localStorage.removeItem('cvita_user');
    router.push(`/${locale}/auth`);
  }

  async function restoreApp(id: string) {
    const token = localStorage.getItem('cvita_token');
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status: 'draft' }),
      });
      setApps(prev => prev.filter(a => a.id !== id));
      showToast('✅ Ansökan återställd!');
    } catch { showToast('Kunde inte återställa'); }
  }

  async function deleteApp(id: string, role: string) {
    if (!confirm(`⚠️ Ta bort "${role}"?\n\nDenna åtgärd kan INTE ångras.`)) return;
    if (!confirm('Är du helt säker?')) return;
    const token = localStorage.getItem('cvita_token');
    try {
      await fetch('/api/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      setApps(prev => prev.filter(a => a.id !== id));
      showToast('🗑️ Ansökan borttagen');
    } catch { showToast('Kunde inte ta bort'); }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <a href={`/${locale}/dashboard`} className={styles.sidebarLogo}>CV<span>zume</span></a>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>{t('nav.main_menu')}</div>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/dashboard`)}><span className={styles.navIcon}>🏠</span> {t('nav.dashboard')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/dashboard`)}><span className={styles.navIcon}>📋</span> {t('nav.applications')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/profile`)}><span className={styles.navIcon}>📄</span> {t('nav.cv')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/letter`)}><span className={styles.navIcon}>✉️</span> {t('nav.letters')}</button>
          <button className={`${styles.navItem} ${styles.active}`}><span className={styles.navIcon}>📁</span> {t('nav.archive')}</button>
          <div className={styles.sidebarSection}>{t('nav.account')}</div>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/settings`)}><span className={styles.navIcon}>⚙️</span> {t('nav.settings')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/upgrade`)}><span className={styles.navIcon}>⚡</span> {t('nav.upgrade')}</button>
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{initials}</div>
            <div>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userPlan}>{planLabel}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span style={{ fontSize: 14 }}>⏻</span> {t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className={styles.main} style={{ padding: '40px' }}>
        <button className={styles.menuToggle} onClick={() => setSidebarOpen(o => !o)} style={{ marginBottom: 16 }}>☰</button>

        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: 'var(--navy)', marginBottom: 6 }}>
            {t('nav.archive')}
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>
            {apps.length} arkiverade ansökningar
          </div>
        </div>

        {loading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Laddar arkiv...</div>}

        {!loading && apps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Inga arkiverade ansökningar ännu</div>
            <div style={{ fontSize: 14 }}>Ansökningar du arkiverar visas här</div>
          </div>
        )}

        {!loading && apps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {apps.map(app => {
              const score = app.match_score || 0;
              const sc = scoreClass(score);
              return (
                <div key={app.id} style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📁</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role || 'Okänd roll'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Arkiverad · {formatDate(app.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: sc === 'score-high' ? '#DCFCE7' : sc === 'score-mid' ? '#FEF9C3' : '#FEE2E2', color: sc === 'score-high' ? '#15803D' : sc === 'score-mid' ? '#854D0E' : '#991B1B' }}>
                      {score}% match
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => restoreApp(app.id)} title="Återställ" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, border: '1.5px solid var(--border)', background: 'white' }}>↩️</button>
                      <button onClick={() => deleteApp(app.id, app.role)} title="Ta bort permanent" style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, border: '1.5px solid var(--border)', background: 'white', color: '#EF4444' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--navy)', color: 'white', padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}