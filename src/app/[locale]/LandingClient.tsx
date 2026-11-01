'use client';

import LogoMark from '@/components/LogoMark';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations, useMessages } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import styles from './landing.module.css';
import AdLinkInput, { isLoneUrl } from './AdLinkInput';
import type { Market } from '@/lib/market';

const LOCALES = [
  { code: 'sv', label: 'Svenska', flag: 'se' },
  { code: 'en', label: 'English', flag: 'gb' },
  { code: 'es', label: 'Español', flag: 'es' },
  { code: 'tr', label: 'Türkçe', flag: 'tr' },
  { code: 'de', label: 'Deutsch', flag: 'de' },
];

// Emoji-flaggor syns inte på Windows — samma bilder som OnboardingModal
function Flag({ code }: { code: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`https://flagcdn.com/w40/${code}.png`} alt="" width={20} height={15} className={styles.flag} />
  );
}



const GUIDE_SLUGS = ['cv-mall', 'personligt-brev-exempel', 'cv-for-nyanlanda', 'vanliga-intervjufragor'];

const STEP_ICONS = ['🔗', '📄', '⬇️'];
const FEATURE_ICONS = ['🎯', '📝', '🔎', '🎤', '📁', '🌐'];

// Demo-exempel: annonsen är alltid på svenska (det är svenska jobb vi hjälper till med).
const SAMPLE_AD = `Undersköterska till äldreboende i norra Stockholm

Vi söker en engagerad undersköterska till vårt äldreboende med 40 lägenheter. Du arbetar i ett team med sjuksköterskor och vårdbiträden och ansvarar för omvårdnad, personlig hygien, måltider och social samvaro för de boende.

Arbetsuppgifter:
- Omvårdnad och stöd i vardagen
- Dokumentation i journalsystem
- Delegerade hälso- och sjukvårdsuppgifter, t.ex. läkemedelsöverlämning
- Kontaktmannaskap och kontakt med anhöriga

Vi söker dig som:
- Har undersköterskeexamen eller motsvarande utbildning
- Har erfarenhet av arbete inom äldreomsorg
- Behärskar svenska i tal och skrift
- Är lugn, lyhörd och samarbetsvillig
- Meriterande: B-körkort, kunskaper i fler språk

Tjänsten är en tillsvidareanställning på 90 %, schemalagd arbetstid dag/kväll samt varannan helg.`;

type DemoResult = {
  matchScore: number | null;
  role: string;
  keyRequirements: string[];
  matched: string[];
  missing: string[];
  cvSummary: string;
  tips: string[];
};

type Step = { title: string; desc: string };
type Faq = { q: string; a: string };
type Plan = { tier: string; price: string; period: string; features: string[]; cta: string; badge?: string; save?: string; billed?: string };
type HeroCopy = { badge: string; h1a: string; h1em: string; h1b: string; sub: string };
type LandingLists = {
  hero: { trust: string[]; markets: Record<Market, HeroCopy> };
  demo: { sub: string; subGeneric: string };
  how: { steps: Step[] };
  features: { items: Step[]; linkItem: Step; baItem?: Step; ijItem?: Step };
  pricing: { free: Plan; pro: Plan; year: Plan };
  faq: { items: Faq[]; languageItem: Faq };
  cta: { note: string[] };
  mock: { jobs: { title: string; co: string }[]; kw: string[]; cvTitle: string };
  // Bara tr/es: lokal exempelannons och mock-jobb för marknaden 'local'
  local?: { sampleAd: string; sampleProfile: string; mockJobs: { title: string; co: string }[]; mockCvTitle: string; mockKw: string[] };
};

export default function LandingClient({ market }: { market: Market }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('landing');
  const L = (useMessages() as unknown as { landing: LandingLists }).landing; // listor/objekt ur messages

  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    // Şifre sıfırlama linki (Supabase izin listesinde yoksa) site köküne dönebilir → giriş sayfasına taşı
    if (/type=recovery|error_code=otp_expired/.test(window.location.hash)) {
      window.location.replace(`/${locale}/auth?mode=reset${window.location.hash}`);
      return;
    }
    const token = localStorage.getItem('cvita_token');
    const user = localStorage.getItem('cvita_user');
    if (token && user) {
      router.replace(`/${locale}/akis`);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.revealVisible);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [locale, router]);

  const authUrl = `/${locale}/auth`;
  const registerUrl = `/${locale}/auth#register`;
  const legal = (slug: string) => `/${locale}/legal/${slug}`;

  function switchLocale(code: string) {
    try { localStorage.setItem('cvita_language', code); } catch { /* ignore */ }
    const rest = pathname.replace(/^\/(sv|en|es|tr|de)(?=\/|$)/, '');
    window.location.assign(`/${code}${rest}${window.location.hash}`);
  }

  const navItems = [
    { href: '#testa', label: t('nav.demo') },
    { href: '#hur', label: t('nav.how') },
    { href: '#funktioner', label: t('nav.features') },
    { href: '#priser', label: t('nav.pricing') },
    { href: '#faq', label: t('nav.faq') },
  ];

  // Utanför Sverige: inga Platsbanken-/svenska-specifika påståenden
  const se = market === 'se';
  const hero = L.hero.markets[market];
  // Tyskland har egen jobbkälla i appen (Bundesagentur) — visa den i stället för länkfunktionen
  const localJobs = market === 'local' ? (locale === 'de' ? L.features.baItem : locale === 'es' ? L.features.ijItem : undefined) : undefined;
  const featureItems = se ? L.features.items : L.features.items.map((f, i) => (i === 2 ? localJobs ?? L.features.linkItem : f));
  const local = market === 'local' ? L.local : undefined;
  const mockJobs = local?.mockJobs ?? L.mock.jobs;
  const mockKw = local?.mockKw ?? L.mock.kw;
  const faqItems = se ? L.faq.items : L.faq.items.map((f, i) => (i === 2 ? L.faq.languageItem : f));

  const plans: { key: string; plan: Plan; cls: string; btn: string }[] = [
    { key: 'free', plan: L.pricing.free, cls: '', btn: styles.btnPricingOutline },
    { key: 'pro', plan: L.pricing.pro, cls: styles.pricingFeatured, btn: styles.btnPricingFill },
    { key: 'year', plan: L.pricing.year, cls: styles.pricingGreen, btn: styles.btnPricingGreen },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--navy)', background: 'white', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav className={styles.nav}>
        <a href={`/${locale}`} className={styles.navLogo}><LogoMark size={30} /><span style={{ color: 'inherit' }}>CV<span>zume</span></span></a>
        <ul className={styles.navLinks}>
          {navItems.map(n => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}
        </ul>
        <div className={styles.navCta}>
          <div className={styles.langWrap}>
            <button
              className={styles.langBtn}
              onClick={() => setLangOpen(o => !o)}
              aria-label={t('nav.language')}
              aria-expanded={langOpen}
            >
              <Flag code={LOCALES.find(l => l.code === locale)?.flag ?? 'se'} /> {locale.toUpperCase()}
            </button>
            {langOpen && (
              <ul className={styles.langMenu}>
                {LOCALES.map(l => (
                  <li key={l.code}>
                    <button
                      className={l.code === locale ? styles.langActive : undefined}
                      onClick={() => switchLocale(l.code)}
                    >
                      <Flag code={l.flag} /> {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <a href={authUrl} className={`${styles.btnGhost} ${styles.hideMobile}`}>{t('nav.login')}</a>
          <a href={registerUrl} className={`${styles.btnNavPrimary} ${styles.hideMobile}`}>{t('nav.start')}</a>
          <button className={styles.navMobile} onClick={() => setMenuOpen(o => !o)} aria-label={t('nav.menu')} aria-expanded={menuOpen}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className={styles.mobileMenu} onClick={() => setMenuOpen(false)}>
          {navItems.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          <a href={authUrl}>{t('nav.login')}</a>
          <a href={registerUrl} className={styles.btnNavPrimary}>{t('nav.start')}</a>
        </div>
      )}

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            {hero.badge}
          </div>
          <h1 className={styles.heroH1}>{hero.h1a} <em>{hero.h1em}</em> {hero.h1b}</h1>
          <p className={styles.heroSub}>{hero.sub}</p>
          <div className={styles.heroActions}>
            <a href={registerUrl} className={styles.btnHero}>{t('hero.cta')}</a>
            <a href="#testa" className={styles.btnHeroGhost}>{t('hero.ctaDemo')}</a>
          </div>
          <ul className={styles.heroTrust}>
            {L.hero.trust.map(s => <li key={s}>✓ {s}</li>)}
          </ul>
        </div>

        {/* Mock product UI */}
        <div className={styles.heroVisual} aria-hidden="true">
          <div className={styles.browserFrame}>
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <div className={`${styles.browserDot} ${styles.bdRed}`} />
                <div className={`${styles.browserDot} ${styles.bdYellow}`} />
                <div className={`${styles.browserDot} ${styles.bdGreen}`} />
              </div>
              <div className={styles.browserUrl}>{t('mock.url')}</div>
            </div>
            <div className={styles.browserContent}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSidebarTitle}>{t('mock.my')}</div>
                {mockJobs.map((j, i) => (
                  <div key={j.title} className={`${styles.mockJob} ${i === 0 ? styles.mockJobActive : styles.mockJob2}`}>
                    <div className={styles.mockJobTitle}>{j.title}</div>
                    <div className={styles.mockJobCo}>{j.co}</div>
                    <div
                      className={styles.mockJobScore}
                      style={i === 0 ? undefined : { background: 'var(--blue-light)', color: 'var(--blue)' }}
                    >
                      {i === 0 ? '✓ ' : ''}{[92, 84, 78][i]}% {t('mock.match')}
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.mockMain}>
                <div className={styles.mockCard}>
                  <div className={styles.mockCardHeader}>
                    <div className={styles.mockCardTitle}>{local?.mockCvTitle ?? t('mock.cvTitle')}</div>
                    <span className={`${styles.mockTag} ${styles.tagGreen}`}>{t('mock.done')}</span>
                  </div>
                  <div className={styles.mockLines}>
                    <div className={`${styles.mockLine} ${styles.wFull} ${styles.accent}`} />
                    <div className={`${styles.mockLine} ${styles.w3q}`} />
                    <div className={`${styles.mockLine} ${styles.wFull}`} />
                    <div className={`${styles.mockLine} ${styles.wHalf}`} />
                    <div className={`${styles.mockLine} ${styles.wFull} ${styles.accent}`} />
                    <div className={`${styles.mockLine} ${styles.w2q}`} />
                  </div>
                </div>
                <div className={styles.mockCard}>
                  <div className={styles.mockCardHeader}>
                    <div className={styles.mockCardTitle}>{t('mock.keywords')}</div>
                    <span className={`${styles.mockTag} ${styles.tagBlue}`}>{t('mock.analysis')}</span>
                  </div>
                  <div className={styles.mockProgressWrap}>
                    {mockKw.map((label, i) => {
                      const pct = [95, 88, 72][i];
                      return (
                        <div key={label} className={styles.mockProgressRow}>
                          <div className={styles.mockProgressLabel}>{label}</div>
                          <div className={styles.mockProgressBar}><div className={styles.mockProgressFill} style={{ width: `${pct}%` }} /></div>
                          <div className={styles.mockProgressPct}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.mockActions}>
                    <span className={`${styles.mockBtn} ${styles.mockBtnPrimary}`}>{t('mock.pdf')}</span>
                    <span className={`${styles.mockBtn} ${styles.mockBtnGhost}`}>{t('mock.edit')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <DemoSection locale={locale} registerUrl={registerUrl} sub={se ? L.demo.sub : L.demo.subGeneric} generic={!se} sample={local} />

      {/* HOW IT WORKS */}
      <section id="hur" className={styles.howSection}>
        <div className={styles.sectionWrap}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="">{t('how.label')}</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">{t('how.title')}</h2>
          <p className={`${styles.sectionSub} ${styles.reveal} ${styles.revealDelay2}`} data-reveal="">{t('how.sub')}</p>
          <div className={styles.steps}>
            {L.how.steps.map((s, i) => (
              <div key={s.title} className={`${styles.step} ${styles.reveal} ${[styles.revealDelay0, styles.revealDelay1, styles.revealDelay2][i]}`} data-reveal="">
                <div className={styles.stepIcon}>{STEP_ICONS[i]}</div>
                <div className={styles.stepTitle}>{s.title}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funktioner" className={styles.featuresSection}>
        <div className={styles.featuresInner}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="">{t('features.label')}</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">{t('features.title')}</h2>
          <div className={styles.featuresGrid}>
            {featureItems.map((f, i) => (
              <div key={f.title} className={`${styles.featureCard} ${styles.reveal} ${[styles.revealDelay0, styles.revealDelay1, styles.revealDelay2][i % 3]}`} data-reveal="">
                <div className={styles.featureIcon}>{FEATURE_ICONS[i]}</div>
                <div className={styles.featureTitle}>{f.title}</div>
                <div className={styles.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="priser" className={styles.pricingSection}>
        <div className={styles.pricingCenter}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="" style={{ display: 'inline-block' }}>{t('pricing.label')}</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">{t('pricing.title')}</h2>
          <p className={`${styles.sectionSub} ${styles.reveal} ${styles.revealDelay2}`} data-reveal="" style={{ margin: '0 auto', textAlign: 'center' }}>{t('pricing.sub')}</p>
        </div>
        <div className={styles.pricingGrid}>
          {plans.map(({ key, plan, cls, btn }, i) => (
            <div key={key} className={`${styles.pricingCard} ${cls} ${styles.reveal} ${[styles.revealDelay0, styles.revealDelay1, styles.revealDelay2][i]}`} data-reveal="">
              {plan.badge && <div className={`${styles.pricingBadge} ${key === 'year' ? styles.pricingBadgeGreen : ''}`}>{plan.badge}</div>}
              <div className={`${styles.pricingTier} ${key === 'year' ? styles.pricingTierGreen : ''}`}>{plan.tier}</div>
              <div className={`${styles.pricingPrice} ${key === 'year' ? styles.pricingPriceGreen : ''}`}>{plan.price} <sup>{t('pricing.currency')}</sup></div>
              <div className={styles.pricingPeriod}>
                {plan.period}
                {plan.save && <> · <strong style={{ color: '#059669' }}>{plan.save}</strong></>}
              </div>
              {plan.billed && <div className={styles.pricingBilled}>{plan.billed}</div>}
              <ul className={styles.pricingFeatures}>
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <a href={registerUrl} className={`${styles.btnPricing} ${btn}`}>{plan.cta}</a>
            </div>
          ))}
        </div>
        <p className={`${styles.pricingNote} ${styles.reveal}`} data-reveal="">{t('pricing.note')}</p>
      </section>

      {/* FAQ */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.faqInner}>
          <div className={styles.sectionLabel}>{t('faq.label')}</div>
          <h2 className={styles.sectionTitle}>{t('faq.title')}</h2>
          <div className={styles.faqList}>
            {faqItems.map(f => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>{t('cta.a')}<br /><em>{t('cta.em')}</em></h2>
        <p className={styles.ctaSub}>{t('cta.sub')}</p>
        <a href={registerUrl} className={styles.btnHero}>{t('cta.button')}</a>
        <p className={styles.ctaNote}>{L.cta.note.map(n => `✓ ${n}`).join('  ·  ')}</p>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <a href={`/${locale}`} className={styles.footerLogo}><LogoMark size={28} /><span style={{ color: 'inherit' }}>CV<span>zume</span></span></a>
            <div className={styles.footerLangs}>
              {LOCALES.map(l => (
                <button key={l.code} onClick={() => switchLocale(l.code)} className={l.code === locale ? styles.langActive : undefined} aria-label={l.label}>
                  <Flag code={l.flag} /> {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.footerCol}>
            <div className={styles.footerHead}>{t('footer.product')}</div>
            {navItems.map(n => <a key={n.href} href={n.href}>{n.label}</a>)}
          </div>
          {se && <div className={styles.footerCol}>
            <div className={styles.footerHead}>{t('footer.guides')}</div>
            {GUIDE_SLUGS.map(slug => <a key={slug} href={`/sv/guide/${slug}`}>{t(`footer.guideLinks.${slug}`)}</a>)}
          </div>}
          <div className={styles.footerCol}>
            <div className={styles.footerHead}>{t('footer.legal')}</div>
            <a href={legal('privacy')}>{t('footer.privacy')}</a>
            <a href={legal('cookies')}>{t('footer.cookies')}</a>
            <a href={legal('terms')}>{t('footer.terms')}</a>
          </div>
          <div className={styles.footerCol}>
            <div className={styles.footerHead}>{t('footer.contact')}</div>
            <a href="mailto:info@cvzume.com">info@cvzume.com</a>
            {/* Sosyal medya */}
            <a href="https://www.facebook.com/cvzume" target="_blank" rel="noopener noreferrer" className={styles.footerSocial}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
              Facebook
            </a>
            <a href="https://www.instagram.com/cvzume" target="_blank" rel="noopener noreferrer" className={styles.footerSocial}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 0 0-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
              Instagram
            </a>
          </div>
          <div className={styles.footerCopy}>© {new Date().getFullYear()} CVzume · {t('footer.copy')}</div>
        </div>
      </footer>
    </div>
  );
}

function DemoSection({ locale, registerUrl, sub, generic, sample }: {
  locale: string; registerUrl: string; sub: string; generic: boolean;
  sample?: { sampleAd: string; sampleProfile: string };
}) {
  const t = useTranslations('landing.demo');
  const [ad, setAd] = useState('');
  const [profile, setProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [result, setResult] = useState<DemoResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');

  function fillSample() {
    setAd(sample?.sampleAd ?? SAMPLE_AD);
    setProfile(sample?.sampleProfile ?? t('sampleProfile'));
  }

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setErrorCode('');
    if (ad.trim().length < 80) { setError(t('errors.too_short')); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobAd: ad, profile, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = ['too_short', 'too_long', 'rate_limited', 'ai_failed'].includes(data.error) ? data.error : 'generic';
        setError(t(`errors.${code}`));
        setErrorCode(code);
        return;
      }
      setResult(data as DemoResult);
      // Annonsen följer med till "Ny ansökan" efter registrering (DashboardClient läser nyckeln).
      try {
        localStorage.setItem('cvita_prefill_job', JSON.stringify({ role: data.role || '', description: ad }));
      } catch { /* ignore */ }
      setTimeout(() => document.getElementById('demo-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.cvSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  function reset() {
    setResult(null);
    setAd('');
    setProfile('');
    document.getElementById('testa')?.scrollIntoView({ behavior: 'smooth' });
  }

  const score = result?.matchScore;
  const scoreColor = score == null ? 'var(--blue)' : score >= 75 ? '#059669' : score >= 50 ? '#D97706' : '#DC2626';

  return (
    <section id="testa" className={styles.demoSection}>
      <div className={styles.demoInner}>
        <div className={styles.sectionLabel}>{t('label')}</div>
        <h2 className={styles.sectionTitle}>{t('title')}</h2>
        <p className={styles.sectionSub}>{sub}</p>

        {!result && (
          <form className={styles.demoForm} onSubmit={analyze}>
            <AdLinkInput pastedUrl={pastedUrl} onFetched={a => setAd(a.text)} generic={generic} />
            <div className={styles.demoField}>
              <div className={styles.demoLabelRow}>
                <label htmlFor="demo-ad">{t('adLabel')}</label>
                <button type="button" className={styles.linkBtn} onClick={fillSample}>{t('sample')}</button>
              </div>
              <textarea
                id="demo-ad"
                value={ad}
                onChange={e => setAd(e.target.value)}
                onPaste={e => {
                  const text = e.clipboardData.getData('text');
                  if (!ad.trim() && isLoneUrl(text)) { e.preventDefault(); setPastedUrl(text.trim()); }
                }}
                placeholder={t('adPlaceholder')}
                rows={9}
                maxLength={6000}
              />
              <div className={styles.demoCount}>{ad.length} / 6000</div>
            </div>
            <div className={styles.demoField}>
              <label htmlFor="demo-profile">{t('profileLabel')}</label>
              <textarea
                id="demo-profile"
                value={profile}
                onChange={e => setProfile(e.target.value)}
                placeholder={t('profilePlaceholder')}
                rows={3}
                maxLength={1500}
              />
            </div>
            {error && (
              <div className={styles.demoError} role="alert">
                {error}
                {errorCode === 'rate_limited' && <> <a href={registerUrl}>{t('lockedCta')}</a></>}
              </div>
            )}
            <div className={styles.demoActions}>
              <button type="submit" className={styles.btnHero} disabled={loading}>
                {loading ? <><span className={styles.spinner} /> {t('analyzing')}</> : t('submit')}
              </button>
              <span className={styles.demoPrivacy}>🔒 {t('privacy')}</span>
            </div>
          </form>
        )}

        {result && (
          <div id="demo-result" className={styles.demoResult}>
            <div className={styles.demoResultHead}>
              {score != null && (
                <div className={styles.scoreRing} style={{ ['--score' as string]: score, ['--score-color' as string]: scoreColor }}>
                  <span>{score}%</span>
                  <small>{t('score')}</small>
                </div>
              )}
              <div>
                {result.role && <div className={styles.demoRole}><small>{t('role')}</small>{result.role}</div>}
                {score == null && <p className={styles.demoHint}>{t('noProfileHint')}</p>}
              </div>
            </div>

            <div className={styles.demoGrid}>
              <div className={styles.demoCard}>
                <h3>{t('requirements')}</h3>
                <div className={styles.chips}>
                  {result.keyRequirements.map(r => {
                    const state = result.matched.includes(r) ? styles.chipOk : result.missing.includes(r) ? styles.chipMiss : '';
                    return <span key={r} className={`${styles.chip} ${state}`}>{r}</span>;
                  })}
                </div>
                {(result.matched.length > 0 || result.missing.length > 0) && (
                  <div className={styles.chipLegend}>
                    <span><i className={styles.dotOk} /> {t('matched')}</span>
                    <span><i className={styles.dotMiss} /> {t('missing')}</span>
                  </div>
                )}
              </div>

              <div className={styles.demoCard}>
                <div className={styles.demoCardHead}>
                  <h3>{score != null ? t('summary') : t('summaryExample')}</h3>
                  <button type="button" className={styles.linkBtn} onClick={copySummary}>{copied ? t('copied') : t('copy')}</button>
                </div>
                <p className={styles.demoSummary}>{result.cvSummary}</p>
              </div>

              {result.tips.length > 0 && (
                <div className={`${styles.demoCard} ${styles.demoWide}`}>
                  <h3>{t('tips')}</h3>
                  <ul className={styles.demoTips}>
                    {result.tips.map(tip => <li key={tip}>{tip}</li>)}
                  </ul>
                </div>
              )}

              <div className={`${styles.demoLocked} ${styles.demoWide}`}>
                <div>
                  <h3>🔓 {t('lockedTitle')}</h3>
                  <p>{t('lockedText')}</p>
                </div>
                <a href={registerUrl} className={styles.btnHero}>{t('lockedCta')}</a>
              </div>
            </div>

            <button type="button" className={styles.linkBtn} onClick={reset} style={{ marginTop: 20 }}>↺ {t('again')}</button>
          </div>
        )}
      </div>
    </section>
  );
}
