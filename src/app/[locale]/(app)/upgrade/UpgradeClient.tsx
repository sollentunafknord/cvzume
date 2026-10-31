'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations, useLocale, useMessages } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-client';
import styles from './upgrade.module.css';


export default function UpgradeClient() {
  const t = useTranslations();
  const tu = useTranslations('upgrade');
  const FAQ_ITEMS = ((useMessages() as unknown as { upgrade?: { faq?: { q: string; a: string }[] } }).upgrade?.faq) ?? [];
  const locale = useLocale();
  const router = useRouter();

  const [checkoutLoadingMonthly, setCheckoutLoadingMonthly] = useState(false);
  const [checkoutLoadingYearly, setCheckoutLoadingYearly] = useState(false);
  const [monthlyDisabled, setMonthlyDisabled] = useState(false);
  const [yearlyDisabled, setYearlyDisabled] = useState(false);
  const [monthlyBtnLabel, setMonthlyBtnLabel] = useState('choose_pro');
  const [yearlyBtnLabel, setYearlyBtnLabel] = useState('choose_yearly');

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [toastError, setToastError] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showToast(msg: string, error = false) {
    setToast(msg); setToastError(error);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const loadUser = useCallback(async () => {
    const saved = localStorage.getItem('cvita_user');
    if (!saved) { router.push(`/${locale}/auth`); return; }
    const user = JSON.parse(saved);
    const isPro = localStorage.getItem('cvita_is_pro') === 'true';

    if (isPro && user.email) {
      try {
        const res = await authFetch('/api/stripe/subscription');
        const data = await res.json();
        if (data.interval === 'yearly') {
          setMonthlyBtnLabel('already_pro'); setMonthlyDisabled(true);
          setYearlyBtnLabel('already_yearly'); setYearlyDisabled(true);
        } else {
          setMonthlyBtnLabel('your_plan'); setMonthlyDisabled(true);
          setYearlyBtnLabel('to_yearly');
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
      const res = await authFetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearly, locale }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'checkout');
      }
    } catch (e: unknown) {
      console.error('checkout', e);
      showToast(tu('error'), true);
      setMonthlyDisabled(false); setYearlyDisabled(false);
      setMonthlyBtnLabel('choose_pro'); setYearlyBtnLabel('choose_yearly');
    } finally {
      setCheckoutLoadingMonthly(false); setCheckoutLoadingYearly(false);
    }
  }

  return (
    <main className={styles.main}>

        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.heroBadge}>{tu('badge')}</div>
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
            <div className={styles.planName}>{tu('free')}</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>0</span>
              <span className={styles.pricePeriod}>{tu('per_month')}</span>
            </div>
            <div className={styles.priceYearly}>&nbsp;</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_apps_free')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_export')}</li>
              <li className={`${styles.featureItem} ${styles.featureMuted}`}><span className={styles.featureCross}>✕</span> {tu('f_no_mark')}</li>
              <li className={`${styles.featureItem} ${styles.featureMuted}`}><span className={styles.featureCross}>✕</span> {tu('f_palettes')}</li>
            </ul>
            <button className={`${styles.planBtn} ${styles.planBtnGhost}`} disabled>{tu('current')}</button>
          </div>

          {/* PRO MONTHLY */}
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <div className={styles.popularBadge} style={{ background: 'var(--blue)' }}>{tu('popular')}</div>
            <div className={styles.planName} style={{ color: 'var(--blue)' }}>{tu('pro')}</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>109</span>
              <span className={styles.pricePeriod}>{tu('per_month')}</span>
            </div>
            <div className={styles.priceYearly}>&nbsp;</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_apps_pro')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_export')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_no_mark')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_palettes')}</li>
            </ul>
            <button
              className={`${styles.planBtn} ${styles.planBtnPrimary}`}
              disabled={monthlyDisabled || checkoutLoadingMonthly}
              onClick={() => startCheckout(false)}
            >
              {checkoutLoadingMonthly ? tu('loading') : tu(monthlyBtnLabel)}
            </button>
          </div>

          {/* PRO YEARLY */}
          <div className={`${styles.pricingCard} ${styles.pricingCardGreen}`}>
            <div className={styles.popularBadge} style={{ background: '#059669' }}>{tu('best')}</div>
            <div className={styles.planName} style={{ color: '#059669' }}>{tu('yearly')}</div>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount} style={{ color: '#059669' }}>83</span>
              <span className={styles.pricePeriod}>{tu('per_month')}</span>
            </div>
            <div className={`${styles.priceYearly} ${styles.priceYearlyHighlight}`}>{tu('yearly_note')}</div>
            <hr className={styles.planDivider} />
            <ul className={styles.featureList}>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_apps_pro')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_export')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_no_mark')}</li>
              <li className={styles.featureItem}><span className={styles.featureCheck}>✓</span> {tu('f_palettes')}</li>
            </ul>
            <button
              className={`${styles.planBtn} ${styles.planBtnPrimary} ${styles.planBtnGreen}`}
              disabled={yearlyDisabled || checkoutLoadingYearly}
              onClick={() => startCheckout(true)}
            >
              {checkoutLoadingYearly ? tu('loading') : tu(yearlyBtnLabel)}
            </button>
          </div>

        </div>

        {/* FAQ */}
        <div className={styles.faqSection}>
          <div className={styles.faqTitle}>{tu('faq_title')}</div>
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