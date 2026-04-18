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
    const isPro = localStorage.getItem('cvita_is_pro') === 'true';

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
    <main className={styles.main}>

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
      {/* Toast */}
      <div className={`${styles.toast} ${toast ? styles.toastShow : ''} ${toastError ? styles.toastError : ''}`}>
        {toast}
      </div>
    </main>
  );
}