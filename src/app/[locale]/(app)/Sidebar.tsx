'use client';

import LogoMark from '@/components/LogoMark';
import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-client';
import { APP_VERSION, RELEASE_DATE } from '@/version';
import { isAdminEmail } from '@/lib/admin';
import { signOut } from '@/lib/auth-client';
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

  // Startvärden måste vara samma på server och klient (annars hydreringsfel #418);
  // localStorage läses i effekten nedan (storageHandler körs direkt vid mount).
  const [initials, setInitials] = useState('?');
  const [userName, setUserName] = useState('');
  const [planLabel, setPlanLabel] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [defaultLocale, setDefaultLocale] = useState<string>(locale);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [langGateTarget, setLangGateTarget] = useState<string | null>(null);

  useEffect(() => {
    const proStatus = localStorage.getItem('cvita_is_pro') === 'true';
    setPlanLabel(proStatus ? t('dashboard.pro_plan') : t('dashboard.free_plan'));
    try {
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      setIsAdmin(isAdminEmail(user.email));
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
    storageHandler();
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
    { code: 'de', flagImg: 'https://flagcdn.com/20x15/de.png', label: 'Deutsch' },
  ];

  async function switchLocale(newLocale: string) {
    if (newLocale === locale) return;
    const def = localStorage.getItem('cvita_default_locale') || locale;
    if (newLocale !== def && !isPro) {
      // Kapıyı göstermeden önce Pro durumunu sunucudan taze kontrol et (eski localStorage değeri
      // ya da AppShell'deki kontrol henüz bitmemişse Pro kullanıcıya yanlışlıkla kapı çıkıyordu).
      const fresh = await checkProNow();
      if (!fresh) {
        setLangGateTarget(newLocale);
        return;
      }
    }
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    window.location.href = `/${newLocale}/${activePage}`;
  }

  async function checkProNow(): Promise<boolean> {
    try {
      const email = JSON.parse(localStorage.getItem('cvita_user') || '{}').email;
      if (!email) return false;
      const res = await authFetch('/api/stripe/subscription');
      const data = await res.json();
      const pro = data.plan === 'pro';
      localStorage.setItem('cvita_is_pro', pro ? 'true' : 'false');
      setIsPro(pro);
      return pro;
    } catch {
      return false;
    }
  }

  function handleLogout() {
    signOut();
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
      {/* Üst çubuk: logo (yeni başvuru) + menü düğmesi; menü sağdan açılır */}
      <header className={styles.topbar}>
        <button className={styles.sidebarLogo} onClick={() => nav('ny')}><LogoMark size={30} /><span>CVzume</span></button>
        <button className={styles.menuToggle} aria-label={t('akis.menu')} aria-expanded={open} onClick={() => setOpen(o => !o)}>☰</button>
      </header>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-hidden={!open}>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>{t('nav.main_menu')}</div>
          {/* Sade menü: ana akış "Ny ansökan"; iş arama, mülakat vb. akışın içinden açılır */}
          <button className={`${styles.navItem} ${seg === 'ny' ? styles.active : ''}`} onClick={() => nav('ny')}>
            <span className={styles.navIcon}>➕</span> {t('nav.ny')}
          </button>
          <button className={`${styles.navItem} ${['ansokningar', 'intervju', 'archive', 'skickade', 'dashboard'].includes(seg) ? styles.active : ''}`} onClick={() => nav('ansokningar')}>
            <span className={styles.navIcon}>📂</span> {t('nav.mina')}
          </button>
          <button className={`${styles.navItem} ${['profile', 'cv'].includes(seg) ? styles.active : ''}`} onClick={() => nav('profile')}>
            <span className={styles.navIcon}>🪪</span> {t('nav.cv')}
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
                style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--blue)', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {t('onboarding.upgrade_btn')}
              </button>
              <button
                onClick={() => setLangGateTarget(null)}
                style={{ padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'white', color: 'var(--slate)', fontSize: 14, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }}
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
