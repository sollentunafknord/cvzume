'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './sidebar.module.css';

interface SidebarProps {
  activePage: string;
  onNavigate: (seg: string) => void;
}

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [initials, setInitials] = useState<string>(() => {
    if (typeof window === 'undefined') return '?';
    try {
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      const fn = user.firstName || user.first_name || user.email?.split('@')[0] || '';
      const ln = user.lastName || user.last_name || '';
      return ((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?';
    } catch { return '?'; }
  });

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      const fn = user.firstName || user.first_name || user.email?.split('@')[0] || '';
      const ln = user.lastName || user.last_name || '';
      return (fn + ' ' + ln).trim() || user.email || '';
    } catch { return ''; }
  });

  const [planLabel, setPlanLabel] = useState('');

  useEffect(() => {
    const isPro = localStorage.getItem('cvita_is_pro') === 'true';
    setPlanLabel(isPro ? t('dashboard.pro_plan') : t('dashboard.free_plan'));
  }, [t]);

  function handleLogout() {
    localStorage.removeItem('cvita_token');
    localStorage.removeItem('cvita_user');
    router.push(`/${locale}/auth`);
  }

  function nav(seg: string) {
    setOpen(false);
    onNavigate(seg);
  }

  const seg = activePage;

  return (
    <>
      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}
      <button className={styles.menuToggle} onClick={() => setOpen(o => !o)}>☰</button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <button className={styles.sidebarLogo} onClick={() => nav('dashboard')}>CV<span>zume</span></button>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>{t('nav.main_menu')}</div>
          <button className={`${styles.navItem} ${seg === 'dashboard' ? styles.active : ''}`} onClick={() => nav('dashboard')}>
            <span className={styles.navIcon}>🏠</span> {t('nav.dashboard')}
          </button>
          <button className={`${styles.navItem} ${seg === 'applications' ? styles.active : ''}`} onClick={() => nav('dashboard')}>
            <span className={styles.navIcon}>📋</span> {t('nav.applications')}
          </button>
          <button className={`${styles.navItem} ${seg === 'profile' ? styles.active : ''}`} onClick={() => nav('profile')}>
            <span className={styles.navIcon}>📄</span> {t('nav.cv')}
          </button>
          <button className={`${styles.navItem} ${seg === 'letter' ? styles.active : ''}`} onClick={() => nav('letter')}>
            <span className={styles.navIcon}>✉️</span> {t('nav.letters')}
          </button>
          <button className={`${styles.navItem} ${seg === 'archive' ? styles.active : ''}`} onClick={() => nav('archive')}>
            <span className={styles.navIcon}>📁</span> {t('nav.archive')}
          </button>
          <div className={styles.sidebarSection}>{t('nav.account')}</div>
          <button className={`${styles.navItem} ${seg === 'settings' ? styles.active : ''}`} onClick={() => nav('settings')}>
            <span className={styles.navIcon}>⚙️</span> {t('nav.settings')}
          </button>
          <button className={`${styles.navItem} ${seg === 'upgrade' ? styles.active : ''}`} onClick={() => nav('upgrade')}>
            <span className={styles.navIcon}>⚡</span> {t('nav.upgrade')}
          </button>
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
    </>
  );
}
