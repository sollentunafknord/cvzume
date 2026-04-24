'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { APP_VERSION, RELEASE_DATE } from '@/version';
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
  const [isAdmin, setIsAdmin] = useState(false);

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
  const [isPro, setIsPro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('cvita_is_pro') === 'true';
  });
  const [defaultLocale, setDefaultLocale] = useState<string>(() => {
    if (typeof window === 'undefined') return locale;
    return localStorage.getItem('cvita_default_locale') || locale;
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('cvita_avatar') || '';
  });
  const [langGateTarget, setLangGateTarget] = useState<string | null>(null);

  useEffect(() => {
    const proStatus = localStorage.getItem('cvita_is_pro') === 'true';
    setPlanLabel(proStatus ? t('dashboard.pro_plan') : t('dashboard.free_plan'));
    try {
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      setIsAdmin(user.email === 'cyesil@gmail.com');
    } catch { /* silent */ }

    const proHandler = (e: Event) => {
      const pro = (e as CustomEvent).detail.isPro;
      setIsPro(pro);
      setPlanLabel(pro ? t('dashboard.pro_plan') : t('dashboard.free_plan'));
    };
    window.addEventListener('cvita_pro_updated', proHandler);

    const storageHandler = () => {
      const av = localStorage.getItem('cvita_avatar') || '';
      setAvatarUrl(av);
      setDefaultLocale(localStorage.getItem('cvita_default_locale') || locale);
      setIsPro(localStorage.getItem('cvita_is_pro') === 'true');
      try {
        const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
        const fn = user.firstName || user.first_name || user.email?.split('@')[0] || '';
        const ln = user.lastName || user.last_name || '';
        setInitials(((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?');
        setUserName((fn + ' ' + ln).trim() || user.email || '');
      } catch { /* silent */ }
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener('cvita_profile_updated', storageHandler);

    return () => {
      window.removeEventListener('cvita_pro_updated', proHandler);
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener('cvita_profile_updated', storageHandler);
    };
  }, [t]);

  const LANGS: { code: string; flagImg: string; label: string }[] = [
    { code: 'sv', flagImg: 'https://flagcdn.com/20x15/se.png', label: 'Svenska' },
    { code: 'en', flagImg: 'https://flagcdn.com/20x15/gb.png', label: 'English' },
    { code: 'es', flagImg: 'https://flagcdn.com/20x15/es.png', label: 'Español' },
    { code: 'tr', flagImg: 'https://flagcdn.com/20x15/tr.png', label: 'Türkçe' },
  ];

  function switchLocale(newLocale: string) {
    if (newLocale === locale) return;
    const def = localStorage.getItem('cvita_default_locale') || locale;
    if (newLocale !== def && !isPro) {
      setLangGateTarget(newLocale);
      return;
    }
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    window.location.href = `/${newLocale}/${activePage}`;
  }

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
          <button className={`${styles.navItem} ${seg === 'applications' ? styles.active : ''}`} onClick={() => nav('applications')}>
            <span className={styles.navIcon}>🔍</span> {t('nav.applications')}
          </button>
          <button className={`${styles.navItem} ${seg === 'profile' ? styles.active : ''}`} onClick={() => nav('profile')}>
            <span className={styles.navIcon}>🪪</span> {t('nav.cv')}
          </button>
          <button className={`${styles.navItem} ${seg === 'letter' ? styles.active : ''}`} onClick={() => nav('letter')}>
            <span className={styles.navIcon}>✍️</span> {t('nav.letters')}
          </button>
          <button className={`${styles.navItem} ${seg === 'skickade' ? styles.active : ''}`} onClick={() => nav('skickade')}>
            <span className={styles.navIcon}>📤</span> {t('nav.skickade')}
          </button>
          <button className={`${styles.navItem} ${seg === 'intervju' ? styles.active : ''}`} onClick={() => nav('intervju')}>
            <span className={styles.navIcon}>🎯</span> {t('nav.intervju')}
          </button>
          <button className={`${styles.navItem} ${seg === 'archive' ? styles.active : ''}`} onClick={() => nav('archive')}>
            <span className={styles.navIcon}>🗄️</span> {t('nav.arkiv')}
          </button>
          <div className={styles.sidebarSection}>{t('nav.account')}</div>
          <button className={`${styles.navItem} ${seg === 'settings' ? styles.active : ''}`} onClick={() => nav('settings')}>
            <span className={styles.navIcon}>⚙️</span> {t('nav.settings')}
          </button>
          <button className={`${styles.navItem} ${seg === 'upgrade' ? styles.active : ''}`} onClick={() => nav('upgrade')}>
            <span className={styles.navIcon}>⚡</span> {t('nav.upgrade')}
          </button>
          {isAdmin && (
            <button className={`${styles.navItem} ${seg === 'admin' ? styles.active : ''}`} onClick={() => nav('admin')}>
              <span className={styles.navIcon}>🛡️</span> Admin
            </button>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
            </div>
            <div>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userPlan}>{planLabel}</div>
            </div>
          </div>
          <div className={styles.langSwitcher}>
            {LANGS.map(l => (
              <button
                key={l.code}
                className={`${styles.langBtn} ${locale === l.code ? styles.langActive : ''}`}
                title={l.label}
                onClick={() => switchLocale(l.code)}
              >
                <img src={l.flagImg} alt={l.label} style={{ width: 20, height: 15, display: 'block' }} />
              </button>
            ))}
          </div>
          <div className={styles.versionTag} title={`Released ${RELEASE_DATE}`}>
            {APP_VERSION}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span style={{ fontSize: 14 }}>⏻</span> {t('nav.logout')}
          </button>
        </div>
      </aside>

      {langGateTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '32px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{t('onboarding.upgrade_title')}</div>
            <div style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 24 }}>{t('onboarding.upgrade_desc')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => { setLangGateTarget(null); nav('upgrade'); }}
                style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
              >
                {t('onboarding.upgrade_btn')}
              </button>
              <button
                onClick={() => setLangGateTarget(null)}
                style={{ padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', color: 'var(--slate)', fontSize: 14, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}
              >
                {t('onboarding.upgrade_cancel', { lang: LANGS.find(l => l.code === defaultLocale)?.label || defaultLocale })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
