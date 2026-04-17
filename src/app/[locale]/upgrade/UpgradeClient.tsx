'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './upgrade.module.css';

const FAQ_ITEMS = [
  { q: 'Kan jag avsluta när som helst?', a: 'Ja, du kan avsluta din prenumeration när som helst. Du behåller Pro-åtkomst till slutet av din betalningsperiod.' },
  { q: 'Hur säker är betalningen?', a: 'Alla betalningar hanteras av Stripe — en av världens ledande betalningsleverantörer. Vi lagrar aldrig dina kortuppgifter.' },
  { q: 'Vad händer med mina data om jag nedgraderar?', a: 'Dina CV-analyser och personliga brev sparas. Du kan fortfarande se dem, men kan inte skapa nya utöver gränsen på 2 per månad.' },
  { q: 'Finns det en årsrabatt?', a: 'Ja! Med årsplan betalar du 999 SEK istället för 1 308 SEK — du sparar 309 kronor, vilket motsvarar nästan 3 månaders gratis användning.' },
  { q: 'Kan jag byta från månads- till årsplan?', a: 'Ja, du kan byta plan när som helst via dina kontoinställningar under "Plan".' },
];

export default function UpgradeClient() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initials, setInitials] = useState('?');
  const [userName, setUserName] = useState('');
  const [planLabel, setPlanLabel] = useState('');

  const [checkoutLoadingMonthly, setCheckoutLoadingMonthly] = useState(false);
  const [checkoutLoadingYearly, setCheckoutLoadingYearly] = useState(false);
  const [monthlyDisabled, setMonthlyDisabled] = useState(false);
  const [yearlyDisabled, setYearlyDisabled] = useState(false);
  const [monthlyBtnLabel, setMonthlyBtnLabel] = useState('Välj Pro →');
  const [yearlyBtnLabel, setYearlyBtnLabel] = useState('Välj Årsplan →');

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);

  function showToast(msg: string, error = false) {
    setToast(msg); setToastError(error);
    setTimeout(() => setToast(''), 3000);
  }

  const loadUser = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const fn = user.firstName || user.email?.split('@')[0] || '';
    const ln = user.lastName || '';
    setUserName((fn + ' ' + ln).trim() || user.email);
    setInitials(((fn[0] || '') + (ln[0] || '')).toUpperCase() || '?');
    const isPro = localStorage.getItem('cvita_is_pro') === 'true';
    setPlanLabel(isPro ? t('dashboard.pro_plan') : t('dashboard.free_plan'));

    if (isPro && user.email) {
      try {
        const res = await fetch(`/api/stripe/subscription?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.interval === 'yearly') {
          setMonthlyBtnLabel('Du är redan Pro ✓'); setMonthlyDisabled(true);
          setYearlyBtnLabel('Du är redan på Årsplan ✓'); setYearlyDisabled(true);
        } else {
          setMonthlyBtnLabel('Din nuvarande plan'); setMonthlyDisabled(true);
          setYearlyBtnLabel('Uppgradera till Årsplan →');
        }
      } catch { /* silent */ }
    }
  }, [locale, router, t]);

  useEffect(() => { loadUser(); }, [loadUser]);

  function handleLogout() {
    localStorage.removeItem('cvita_token');
    localStorage.removeItem('cvita_user');
    router.push(`/${locale}/auth`);
  }

  async function startCheckout(yearly: boolean) {
    if (yearly) setCheckoutLoadingYearly(true);
    else setCheckoutLoadingMonthly(true);
    setMonthlyDisabled(true); setYearlyDisabled(true);

    try {
      const user = JSON.parse(localStorage.getItem('cvita_user') || '{}');
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, yearly }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Något gick fel');
      }
    } catch (e: unknown) {
      showToast('Fel: ' + (e instanceof Error ? e.message : 'okänt'), true);
      setMonthlyDisabled(false); setYearlyDisabled(false);
      setMonthlyBtnLabel('Välj Pro →'); setYearlyBtnLabel('Välj Årsplan →');
    } finally {
      setCheckoutLoadingMonthly(false); setCheckoutLoadingYearly(false);
    }
  }

  return (
    <div className={styles.layout}>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <a href={`/${locale}/dashboard`} className={styles.sidebarLogo}>CV<span>zume</span></a>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>{t('nav.main_menu')}</div>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/dashboard`)}><span className={styles.navIcon}>🏠</span> {t('nav.dashboard')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/dashboard`)}><span className={styles.navIcon}>📋</span> {t('nav.applications')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/profile`)}><span className={styles.navIcon}>📄</span> {t('nav.cv')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/letter`)}><span className={styles.navIcon}>✉️</span> {t('nav.letters')}</button>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/archive`)}><span className={styles.navIcon}>📁</span> {t('nav.archive')}</button>
          <div className={styles.sidebarSection}>{t('nav.account')}</div>
          <button className={styles.navItem} onClick={() => router.push(`/${locale}/settings`)}><span className={styles.navIcon}>⚙️</span> {t('nav.settings')}</button>
          <button className={`${styles.navItem} ${styles.active}`}><span className={styles.navIcon}>⚡</span> {t('nav.upgrade')}</button>
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

      {/* MAIN */}
      <main className={styles.main}>
        <button className={styles.menuToggle} onClick={() => setSidebarOpen(o => !o)}>☰</button>

        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>⚡ Uppgradera</div>
          <h1 className={styles.heroTitle}>
            {t('upgrade.title').split(' ').slice(0, -2).join(' ')}{' '}
            <span>{t('upgrade.title').split(' ').slice(-2).join(' ')}</span>
          </h1>
          <p className={styles.heroSubtitle}>{t('upgrade.subtitle')}</p>
        </div>

        {/* PRICING CARDS */}
        <div className={styles.pricingGrid}>

          {/* FREE */}
          <div className={styles.pricingCard}>
            <div className={styles.planName}>Gratis</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>0</span>
              <span className={styles.pricePeriod}>SEK/mån</span>
            </div>
            <div className={styles.priceYearly}>&nbsp;</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> 2 CV-analyser per månad</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> 2 personliga brev per månad</li>
              <li className={`${styles.featureItem} ${styles.featureMuted}`}><span className={styles.featureCross}>✕</span> PDF-export</li>
              <li className={`${styles.featureItem} ${styles.featureMuted}`}><span className={styles.featureCross}>✕</span> Prioriterad AI</li>
              <li className={`${styles.featureItem} ${styles.featureMuted}`}><span className={styles.featureCross}>✕</span> Obegränsad historik</li>
            </ul>
            <button className={`${styles.planBtn} ${styles.planBtnGhost}`} disabled>Ditt nuvarande paket</button>
          </div>

          {/* PRO MONTHLY */}
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <div className={styles.popularBadge} style={{ background: 'var(--blue)' }}>⭐ Mest populärt</div>
            <div className={styles.planName} style={{ color: 'var(--blue)' }}>Pro</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>109</span>
              <span className={styles.pricePeriod}>SEK/mån</span>
            </div>
            <div className={styles.priceYearly}>&nbsp;</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsade CV-analyser</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsade personliga brev</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> PDF-export</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Prioriterad AI</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsad historik</li>
            </ul>
            <button
              className={`${styles.planBtn} ${styles.planBtnPrimary}`}
              disabled={monthlyDisabled || checkoutLoadingMonthly}
              onClick={() => startCheckout(false)}
            >
              {checkoutLoadingMonthly ? 'Laddar...' : monthlyBtnLabel}
            </button>
          </div>

          {/* PRO YEARLY */}
          <div className={`${styles.pricingCard} ${styles.pricingCardGreen}`} style={{ gridColumn: '1 / -1', maxWidth: 380, margin: '0 auto', width: '100%' }}>
            <div className={styles.popularBadge} style={{ background: '#059669' }}>🌟 Bästa värdet</div>
            <div className={styles.planName} style={{ color: '#059669' }}>Pro Årsplan</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount} style={{ color: '#059669' }}>83</span>
              <span className={styles.pricePeriod}>SEK/mån</span>
            </div>
            <div className={`${styles.priceYearly} ${styles.priceYearlyHighlight}`}>999 SEK/år — spara 309 kr!</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsade CV-analyser</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsade personliga brev</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> PDF-export</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Prioriterad AI</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> Obegränsad historik</li>
            </ul>
            <button
              className={`${styles.planBtn} ${styles.planBtnPrimary} ${styles.planBtnGreen}`}
              disabled={yearlyDisabled || checkoutLoadingYearly}
              onClick={() => startCheckout(true)}
            >
              {checkoutLoadingYearly ? 'Laddar...' : yearlyBtnLabel}
            </button>
          </div>

        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <div className={styles.faqTitle}>Vanliga frågor</div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={styles.faqItem}>
              <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                <span className={`${styles.faqIcon} ${openFaq === i ? styles.faqIconOpen : ''}`}>+</span>
              </button>
              {openFaq === i && <div className={styles.faqAnswer}>{item.a}</div>}
            </div>
          ))}
        </div>
      </main>

      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastError ? styles.toastError : ''}`}>
        {toast}
      </div>
    </div>
  );
}